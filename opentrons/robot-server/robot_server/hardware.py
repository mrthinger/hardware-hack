"""Hardware API wrapper module for initialization and management."""
import asyncio
import logging
from pathlib import Path
from fastapi import Depends, status
from typing import (
    TYPE_CHECKING,
    cast,
    Awaitable,
    Callable,
    Iterator,
    Iterable,
    Optional,
    Tuple,
)
from uuid import uuid4  # direct to avoid import cycles in service.dependencies
from traceback import format_exception_only, TracebackException
from contextlib import contextmanager, suppress

from opentrons_shared_data import deck
from opentrons_shared_data.robot.dev_types import RobotType, RobotTypeEnum

from opentrons import initialize as initialize_api, should_use_ot3
from opentrons.config import (
    IS_ROBOT,
    ARCHITECTURE,
    SystemArchitecture,
    feature_flags as ff,
)
from opentrons.util.helpers import utc_now
from opentrons.hardware_control import ThreadManagedHardware, HardwareControlAPI, API
from opentrons.hardware_control.simulator_setup import load_simulator_thread_manager
from opentrons.hardware_control.types import StatusBarState
from opentrons.protocols.api_support.deck_type import (
    guess_from_global_config as guess_deck_type_from_global_config,
)
from opentrons.protocol_engine import DeckType

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from .errors.robot_errors import (
    NotSupportedOnOT2,
    NotSupportedOnFlex,
    HardwareNotYetInitialized,
    HardwareFailedToInitialize,
)
from .settings import get_settings, RobotServerSettings
from .subsystems.firmware_update_manager import (
    FirmwareUpdateManager,
    UpdateProcessHandle,
)
from .subsystems.models import SubSystem
from .service.task_runner import TaskRunner, get_task_runner

from .robot.control.estop_handler import EstopHandler

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


PostInitCallback = Tuple[
    Callable[[AppState, HardwareControlAPI], Awaitable[None]], bool
]
"""Function to be called when hardware init completes.
    - First item is the callback
    - Second item is True if this should be called BEFORE the postinit
    function, or False if this should be called AFTER the postinit function."""

log = logging.getLogger(__name__)

_hw_api_accessor = AppStateAccessor[ThreadManagedHardware]("hardware_api")
_init_task_accessor = AppStateAccessor["asyncio.Task[None]"]("hardware_init_task")
_front_button_light_blinker_accessor = AppStateAccessor["_FrontButtonLightBlinker"](
    "front_button_light_blinker"
)
_postinit_task_accessor = AppStateAccessor["asyncio.Task[None]"](
    "hardware_postinit_task"
)
_firmware_update_manager_accessor = AppStateAccessor[FirmwareUpdateManager](
    "firmware_update_manager"
)
_estop_handler_accessor = AppStateAccessor[EstopHandler]("estop_handler")


class _ExcPassthrough(BaseException):
    def __init__(self, payload: TracebackException) -> None:
        self.payload = payload


def start_initializing_hardware(
    app_state: AppState, callbacks: Iterable[PostInitCallback]
) -> None:
    """Initialize the hardware API singleton, attaching it to global state.

    Returns immediately while the hardware API initializes in the background.

    Any defined callbacks will be called after the hardware API is initialized, but
    before the post-init tasks are executed.
    """
    initialize_task = _init_task_accessor.get_from(app_state)

    if initialize_task is None:
        initialize_task = asyncio.create_task(
            _initialize_hardware_api(app_state, callbacks)
        )
        _init_task_accessor.set_on(app_state, initialize_task)


async def clean_up_hardware(app_state: AppState) -> None:
    """Shutdown the HardwareAPI singleton and remove it from global state."""
    initialize_task = _init_task_accessor.get_from(app_state)
    thread_manager = _hw_api_accessor.get_from(app_state)
    postinit_task = _postinit_task_accessor.get_from(app_state)
    _init_task_accessor.set_on(app_state, None)
    _postinit_task_accessor.set_on(app_state, None)
    _hw_api_accessor.set_on(app_state, None)

    if initialize_task is not None:
        initialize_task.cancel()
        # Ignore exceptions, since they've already been logged.
        await asyncio.gather(initialize_task, return_exceptions=True)

    if postinit_task is not None:
        postinit_task.cancel()
        await asyncio.gather(postinit_task, return_exceptions=True)

    if thread_manager is not None:
        thread_manager.clean_up()


# TODO(mm, 2024-01-30): Consider merging this with the Flex's LightController.
class _FrontButtonLightBlinker:
    def __init__(self) -> None:
        self._hardware_and_task: Optional[
            Tuple[HardwareControlAPI, "asyncio.Task[None]"]
        ] = None
        self._hardware_init_complete = False
        self._persistence_init_complete = False

    async def set_hardware(self, hardware: HardwareControlAPI) -> None:
        assert self._hardware_and_task is None, "hardware should only be set once."

        async def blink_forever() -> None:
            while True:
                await hardware.set_lights(button=True)
                await asyncio.sleep(0.5)
                await hardware.set_lights(button=False)
                await asyncio.sleep(0.5)

        task = asyncio.create_task(blink_forever())

        self._hardware_and_task = (hardware, task)

    async def mark_hardware_init_complete(self) -> None:
        self._hardware_init_complete = True
        await self._maybe_stop_blinking()

    async def mark_persistence_init_complete(self) -> None:
        self._persistence_init_complete = True
        await self._maybe_stop_blinking()

    async def clean_up(self) -> None:
        if self._hardware_and_task is not None:
            _, task = self._hardware_and_task
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task

    async def _maybe_stop_blinking(self) -> None:
        if self._hardware_and_task is not None and self._all_complete():
            # We're currently blinking, but we should stop.
            hardware, task = self._hardware_and_task
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
            await hardware.set_lights(button=True)

    def _all_complete(self) -> bool:
        return self._persistence_init_complete and self._hardware_init_complete


def fbl_init(app_state: AppState) -> None:
    """Prepare to blink the OT-2's front button light.

    This should be called once during server startup.
    """
    if should_use_ot3():
        # This is only for the OT-2's front button light.
        # The Flex's status bar is handled elsewhere -- see LightController.
        return
    _front_button_light_blinker_accessor.set_on(app_state, _FrontButtonLightBlinker())


async def fbl_start_blinking(app_state: AppState, hardware: HardwareControlAPI) -> None:
    """Start blinking the OT-2's front button light.

    This should be called once during server startup, as soon as the hardware is
    initialized enough to support the front button light.

    Note that this is preceded by two other visually indistinguishable stages of
    blinking:
    1. A separate system process blinks the light while this process's Python
       interpreter is initializing.
    2. build_hardware_controller() blinks the light internally while it's doing hardware
       initialization.

    Blinking will continue until `fbl_mark_hardware_init_complete()` and
    `fbl_mark_persistence_init_complete()` have both been called.
    """
    blinker = _front_button_light_blinker_accessor.get_from(app_state)
    if blinker is not None:  # May be None on a Flex.
        await blinker.set_hardware(hardware)


async def fbl_mark_hardware_init_complete(
    app_state: AppState, hardware: HardwareControlAPI
) -> None:
    """See `fbl_start_blinking()`."""
    blinker = _front_button_light_blinker_accessor.get_from(app_state)
    if blinker is not None:  # May be None on a Flex.
        await blinker.mark_hardware_init_complete()


async def fbl_mark_persistence_init_complete(app_state: AppState) -> None:
    """See `fbl_start_blinking()`."""
    blinker = _front_button_light_blinker_accessor.get_from(app_state)
    if blinker is not None:  # May be None on a Flex.
        await blinker.mark_persistence_init_complete()


async def fbl_clean_up(app_state: AppState) -> None:
    """Clean up the background task that blinks the OT-2's front button light."""
    blinker = _front_button_light_blinker_accessor.get_from(app_state)
    if blinker is not None:
        await blinker.clean_up()


# TODO(mm, 2022-10-18): Deduplicate this background initialization infrastructure
# with similar code used for initializing the persistence layer.
async def get_thread_manager(
    app_state: AppState = Depends(get_app_state),
) -> ThreadManagedHardware:
    """Get the ThreadManager'd HardwareAPI as a route dependency.

    Arguments:
        app_state: Global app state from `app.state`, provided by
            FastAPI's dependency injection system via `fastapi.Depends`

    Returns:
        The initialized ThreadManager containing a HardwareAPI

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    initialize_task = _init_task_accessor.get_from(app_state)
    postinit_task = _postinit_task_accessor.get_from(app_state)
    hardware_api = _hw_api_accessor.get_from(app_state)

    if initialize_task is None or hardware_api is None or not initialize_task.done():
        raise HardwareNotYetInitialized().as_error(status.HTTP_503_SERVICE_UNAVAILABLE)

    if initialize_task.cancelled():
        raise HardwareFailedToInitialize(
            detail="Hardware initialization cancelled."
        ).as_error(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if initialize_task.exception():
        exc = initialize_task.exception()
        raise HardwareFailedToInitialize(detail=str(exc)).as_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) from exc

    if postinit_task and postinit_task.done() and postinit_task.exception():
        with _format_exc_only("Hardware failed to initialize"):
            postinit_task.result()
        exc = cast(Exception, postinit_task.exception())
        raise HardwareFailedToInitialize(detail=str(exc)).as_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) from exc

    return hardware_api


async def get_hardware(
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> HardwareControlAPI:
    """Get the HardwareAPI as a route dependency.

    Arguments:
        thread_manager: The global thread manager singleton, provided by
            FastAPI's dependency injection system via `fastapi.Depends`

    Returns:
        The same object, but this time properly typed as a hardware controller.
        It is still a ThreadManager and provides the same guarantees that
        everything will be run in another thread, but will be checked by mypy
        as if it was the hardware controller.

    Raises:
        ApiError: The Hardware API is still initializing or failed to initialize.
    """
    return thread_manager.wrapped()


def get_ot3_hardware(
    thread_manager: ThreadManagedHardware,
) -> "OT3API":
    """Get a flex hardware controller."""
    try:
        from opentrons.hardware_control.ot3api import OT3API
    except ImportError as exception:
        raise NotSupportedOnOT2(detail=str(exception)).as_error(
            status.HTTP_403_FORBIDDEN
        ) from exception
    if not thread_manager.wraps_instance(OT3API):
        raise NotSupportedOnOT2(
            detail="This route is only available on a Flex."
        ).as_error(status.HTTP_403_FORBIDDEN)
    return cast(OT3API, thread_manager.wrapped())


def get_ot2_hardware(
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> "API":
    """Get an OT2 hardware controller."""
    if not thread_manager.wraps_instance(API):
        raise NotSupportedOnFlex(
            detail="This route is only available on an OT-2."
        ).as_error(status.HTTP_403_FORBIDDEN)
    return cast(API, thread_manager.wrapped())


async def get_firmware_update_manager(
    app_state: AppState = Depends(get_app_state),
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
    task_runner: TaskRunner = Depends(get_task_runner),
) -> FirmwareUpdateManager:
    """Get an update manager to track firmware update statuses."""
    hardware = get_ot3_hardware(thread_manager)
    update_manager = _firmware_update_manager_accessor.get_from(app_state)

    if update_manager is None:
        update_manager = FirmwareUpdateManager(
            task_runner=task_runner, hw_handle=hardware
        )
        _firmware_update_manager_accessor.set_on(app_state, update_manager)
    return update_manager


async def get_estop_handler(
    app_state: AppState = Depends(get_app_state),
    thread_manager: ThreadManagedHardware = Depends(get_thread_manager),
) -> EstopHandler:
    """Get an Estop Handler for working with the estop."""
    hardware = get_ot3_hardware(thread_manager)
    estop_handler = _estop_handler_accessor.get_from(app_state)

    if estop_handler is None:
        estop_handler = EstopHandler(hw_handle=hardware)
        _estop_handler_accessor.set_on(app_state, estop_handler)
    return estop_handler


async def get_robot_type() -> RobotType:
    """Return what kind of robot this server is running on."""
    return "OT-3 Standard" if should_use_ot3() else "OT-2 Standard"


async def get_robot_type_enum() -> RobotTypeEnum:
    """Return what kind of robot this server is running on."""
    return RobotTypeEnum.FLEX if should_use_ot3() else RobotTypeEnum.OT2


async def get_deck_type() -> DeckType:
    """Return what kind of deck the robot that this server is running on has."""
    return DeckType(guess_deck_type_from_global_config())


async def get_deck_definition(
    deck_type: DeckType = Depends(get_deck_type),
) -> deck.dev_types.DeckDefinitionV5:
    """Return this robot's deck definition."""
    return deck.load(deck_type, version=5)


async def _postinit_ot2_tasks(
    hardware: ThreadManagedHardware,
    app_state: AppState,
    callbacks: Iterable[PostInitCallback],
) -> None:
    """Tasks to run on an initialized OT-2 before it is ready to use."""
    try:
        await _home_on_boot(hardware.wrapped())
    finally:
        for callback in callbacks:
            if not callback[1]:
                await callback[0](app_state, hardware.wrapped())


async def _home_on_boot(hardware: HardwareControlAPI) -> None:
    if ff.disable_home_on_boot():
        return
    log.info("Homing Z axes")
    try:
        await hardware.home_z()
    except Exception:
        # If this is a flex, and the estop is asserted, we'll get an error
        # here; make sure that it doesn't prevent things from actually
        # starting.
        log.error("Exception homing z on startup, ignoring to allow server to start")


async def _do_updates(
    hardware: "OT3API", update_manager: FirmwareUpdateManager
) -> None:
    update_handles = [
        await update_manager.start_update_process(
            str(uuid4()), SubSystem.from_hw(subsystem), utc_now()
        )
        for subsystem, subsystem_state in hardware.attached_subsystems.items()
        if not subsystem_state.ok or subsystem_state.fw_update_needed
    ]

    async def _until_update_finishes(handle: UpdateProcessHandle) -> None:
        while True:
            progress = await handle.get_progress()
            if progress.error:
                log.error(
                    f"Error updating {handle.process_details.subsystem}: {progress.error}"
                )
                return
            elif progress.state == type(progress.state).done:  # noqa: E721
                log.info(f"Update complete for {handle.process_details.subsystem}")
                return
            else:
                await asyncio.sleep(1)

    await asyncio.gather(*(_until_update_finishes(handle) for handle in update_handles))


async def _postinit_ot3_tasks(
    hardware_tm: ThreadManagedHardware,
    app_state: AppState,
    callbacks: Iterable[PostInitCallback],
) -> None:
    """Tasks to run on an initialized OT-3 before it is ready to use."""
    update_manager = await get_firmware_update_manager(
        app_state=app_state,
        thread_manager=hardware_tm,
        task_runner=get_task_runner(app_state),
    )

    hardware = cast("OT3API", hardware_tm)

    try:
        await _do_updates(hardware, update_manager)
        await hardware.cache_instruments()
        await _home_on_boot(hardware)
        await hardware.set_status_bar_state(StatusBarState.ACTIVATION)
        for callback in callbacks:
            if not callback[1]:
                await callback[0](app_state, hardware_tm.wrapped())

    except Exception:
        log.exception("Hardware initialization failure")
        raise


async def _initialize_ot3_robot(
    app_state: AppState, settings: RobotServerSettings, systemd_available: bool
) -> ThreadManagedHardware:
    """Initialize the OT-3 robot system."""
    if settings.simulator_configuration_file_path:
        return await _initialize_simulated_hardware(
            settings.simulator_configuration_file_path
        )
    else:
        return await initialize_api()


async def _initialize_ot2_robot(
    app_state: AppState, settings: RobotServerSettings, systemd_available: bool
) -> ThreadManagedHardware:
    """Initialize the OT-2 robot system."""
    if systemd_available:
        # During boot, opentrons-gpio-setup.service will be blinking the
        # front button light. Kill it here and wait for it to exit so it releases
        # that GPIO line. Otherwise, our hardware initialization would get a
        # "device already in use" error.
        service_to_stop = "opentrons-gpio-setup"
        command = ["systemctl", "stop", service_to_stop]
        subprocess = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await subprocess.communicate()
        if subprocess.returncode == 0:
            log.info(f"Stopped {service_to_stop}.")
        else:
            raise RuntimeError(
                f"Error stopping {service_to_stop}.",
                {
                    "returncode": subprocess.returncode,
                    "stdout": stdout,
                    "stderr": stderr,
                },
            )
    if settings.simulator_configuration_file_path:
        return await _initialize_simulated_hardware(
            settings.simulator_configuration_file_path
        )
    else:
        return await initialize_api()


async def _initialize_simulated_hardware(
    simulator_config: str,
) -> ThreadManagedHardware:
    """Initialize a simulated hardware API."""
    simulator_config_path = Path(simulator_config)
    log.info(f"Loading simulator from {simulator_config_path}")

    return await load_simulator_thread_manager(path=simulator_config_path)


def _postinit_done_handler(task: "asyncio.Task[None]") -> None:
    if task.exception():
        with _format_exc("Postinit task failed"):
            task.result()
    else:
        log.info("Postinit task complete")


def _systemd_notify(systemd_available: bool) -> None:
    if systemd_available:
        try:
            import systemd.daemon  # type: ignore

            systemd.daemon.notify("READY=1")
        except ImportError:
            pass


async def _wrap_postinit(postinit: Awaitable[None]) -> None:
    try:
        return await postinit
    except BaseException as be:
        raise _ExcPassthrough(TracebackException.from_exception(be))


@contextmanager
def _format_exc_only(log_prefix: str) -> Iterator[None]:
    try:
        yield
    except _ExcPassthrough as passthrough:
        log.error(
            f"{log_prefix}: {''.join(list(passthrough.payload.format_exception_only()))}"
        )
    except BaseException as be:
        log.error(f"{log_prefix}: {format_exception_only(type(be), be)}")


@contextmanager
def _format_exc(log_prefix: str) -> Iterator[None]:
    try:
        yield
    except _ExcPassthrough as passthrough:
        log.error(
            f"{log_prefix}: {''.join(list(passthrough.payload.format(chain=True)))}"
        )
    except BaseException as be:
        log.error(f"{log_prefix}: {format_exception_only(type(be), be)}")


async def _initialize_hardware_api(
    app_state: AppState, callbacks: Iterable[PostInitCallback]
) -> None:
    """Initialize the HardwareAPI and attach it to global state."""
    app_settings = get_settings()
    systemd_available = IS_ROBOT and ARCHITECTURE != SystemArchitecture.HOST
    try:
        if should_use_ot3():
            hardware = await _initialize_ot3_robot(
                app_state, app_settings, systemd_available
            )
        else:
            hardware = await _initialize_ot2_robot(
                app_state, app_settings, systemd_available
            )

        _hw_api_accessor.set_on(app_state, hardware)

        for callback in callbacks:
            if callback[1]:
                await callback[0](app_state, hardware.wrapped())

        # This ties systemd notification to hardware initialization. We might want to move
        # systemd notification so it also waits for DB migration+initialization.
        # If we do that, we need to be careful:
        # - systemd timeouts might need to be increased to allow for DB migration time
        # - There might be UI implications for loading states on the Flex's on-device display,
        #   because it polls for the server's systemd status.
        _systemd_notify(systemd_available)

        if should_use_ot3():
            postinit_task = asyncio.create_task(
                _wrap_postinit(_postinit_ot3_tasks(hardware, app_state, callbacks))
            )
        else:
            postinit_task = asyncio.create_task(
                _wrap_postinit(_postinit_ot2_tasks(hardware, app_state, callbacks))
            )

        postinit_task.add_done_callback(_postinit_done_handler)
        _postinit_task_accessor.set_on(app_state, postinit_task)

        log.info("Opentrons hardware API initialized")

    except Exception:
        # If something went wrong, log it here, in case the robot is powered off
        # ungracefully before our cleanup code has a chance to run and receive
        # the exception.
        #
        # todo(mm, 2021-10-22): Logging this exception should be the responsibility
        # of calling code, but currently, nothing catches exceptions raised from
        # this background initialization task. Once that's fixed, this log.error()
        # should be removed,
        log.exception("Exception during hardware background initialization.")
        raise
