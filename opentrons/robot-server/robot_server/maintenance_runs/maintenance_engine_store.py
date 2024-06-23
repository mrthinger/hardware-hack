"""In-memory storage of ProtocolEngine instances."""
import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Callable

from opentrons.protocol_engine.errors.exceptions import EStopActivatedError
from opentrons.protocol_engine.types import PostRunHardwareState, DeckConfigurationType
from opentrons.protocol_engine import (
    Config as ProtocolEngineConfig,
    DeckType,
    LabwareOffsetCreate,
    StateSummary,
    create_protocol_engine,
    CommandSlice,
    CommandPointer,
    Command,
    CommandCreate,
    LabwareOffset,
)
from opentrons.protocol_runner import RunResult, RunOrchestrator

from opentrons.config import feature_flags

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    EstopState,
    HardwareEvent,
    EstopStateNotification,
    HardwareEventHandler,
)

from opentrons_shared_data.robot.dev_types import RobotType, RobotTypeEnum
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

_log = logging.getLogger(__name__)


class EngineConflictError(RuntimeError):
    """An error raised if an active engine is already initialized.

    The store will not create a new engine unless the "current" runner/engine
    pair is idle.
    """


class NoRunnerEnginePairError(RuntimeError):
    """Raised if you try to get the current engine or runner while there is none."""


class NoRunOrchestrator(RuntimeError):
    """Raised if you try to get the current run orchestrator while there is none."""


async def handle_estop_event(
    engine_store: "MaintenanceEngineStore", event: HardwareEvent
) -> None:
    """Handle an E-stop event from the hardware API.

    This is meant to run in the engine's thread and asyncio event loop.

    This is a public function for unit-testing purposes, but it's an implementation
    detail of the store.
    """
    try:
        if isinstance(event, EstopStateNotification):
            if event.new_state is not EstopState.PHYSICALLY_ENGAGED:
                return
            if engine_store.current_run_id is None:
                return
            # todo(mm, 2024-04-17): This estop teardown sequencing belongs in the
            # runner layer.
            engine_store.run_orchestrator.estop()
            await engine_store.run_orchestrator.finish(error=EStopActivatedError())
    except Exception:
        # This is a background task kicked off by a hardware event,
        # so there's no one to propagate this exception to.
        _log.exception("Exception handling E-stop event.")


def _get_estop_listener(engine_store: "MaintenanceEngineStore") -> HardwareEventHandler:
    """Create a callback for estop events.

    The returned callback is meant to run in the hardware API's thread.
    """
    engine_loop = asyncio.get_running_loop()

    def run_handler_in_engine_thread_from_hardware_thread(
        event: HardwareEvent,
    ) -> None:
        asyncio.run_coroutine_threadsafe(
            handle_estop_event(engine_store, event), engine_loop
        )

    return run_handler_in_engine_thread_from_hardware_thread


class MaintenanceEngineStore:
    """Factory and in-memory storage for ProtocolEngine."""

    _run_orchestrator: Optional[RunOrchestrator] = None
    _created_at: Optional[datetime] = None

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        robot_type: RobotType,
        deck_type: DeckType,
    ) -> None:
        """Initialize an engine storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
            robot_type: Passed along to `opentrons.protocol_engine.Config`.
            deck_type: Passed along to `opentrons.protocol_engine.Config`.
        """
        self._hardware_api = hardware_api
        self._robot_type = robot_type
        self._deck_type = deck_type
        hardware_api.register_callback(_get_estop_listener(self))

    @property
    def run_orchestrator(self) -> RunOrchestrator:
        """Get the "current" RunOrchestrator."""
        if self._run_orchestrator is None:
            raise NoRunOrchestrator()
        return self._run_orchestrator

    @property
    def current_run_id(self) -> Optional[str]:
        """Get the run identifier associated with the current engine."""
        return (
            self.run_orchestrator.run_id if self._run_orchestrator is not None else None
        )

    @property
    def current_run_created_at(self) -> datetime:
        """Get the run creation datetime."""
        assert self._created_at is not None, "Run not yet created."
        return self._created_at

    async def create(
        self,
        run_id: str,
        created_at: datetime,
        labware_offsets: List[LabwareOffsetCreate],
        notify_publishers: Callable[[], None],
        deck_configuration: Optional[DeckConfigurationType] = [],
    ) -> StateSummary:
        """Create and store a ProtocolRunner and ProtocolEngine for a given Run.

        Args:
            run_id: The run resource the engine is assigned to.
            created_at: Run creation datetime
            labware_offsets: Labware offsets to create the engine with.
            notify_publishers: Utilized by the engine to notify publishers of state changes.

        Returns:
            The initial equipment and status summary of the engine.
        """
        # Because we will be clearing engine store before creating a new one,
        # the runner-engine pair should be None at this point.
        assert (
            self._run_orchestrator is None
        ), "There is an active maintenance run that was not cleared correctly."
        engine = await create_protocol_engine(
            hardware_api=self._hardware_api,
            config=ProtocolEngineConfig(
                robot_type=self._robot_type,
                deck_type=self._deck_type,
                block_on_door_open=feature_flags.enable_door_safety_switch(
                    RobotTypeEnum.robot_literal_to_enum(self._robot_type)
                ),
            ),
            deck_configuration=deck_configuration,
            notify_publishers=notify_publishers,
        )

        for offset in labware_offsets:
            engine.add_labware_offset(offset)

        self._run_orchestrator = RunOrchestrator.build_orchestrator(
            run_id=run_id, protocol_engine=engine, hardware_api=self._hardware_api
        )

        self._created_at = created_at

        return self._run_orchestrator.get_state_summary()

    async def clear(self) -> RunResult:
        """Remove the ProtocolEngine.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            they cannot be cleared.
        """
        if self.run_orchestrator.get_is_okay_to_clear():
            await self.run_orchestrator.finish(
                drop_tips_after_run=False,
                set_run_status=False,
                post_run_hardware_state=PostRunHardwareState.STAY_ENGAGED_IN_PLACE,
            )
        else:
            raise EngineConflictError("Current run is not idle or stopped.")

        run_data = self.run_orchestrator.get_state_summary()
        commands = self.run_orchestrator.get_all_commands()
        self._run_orchestrator = None
        self._created_at = None

        return RunResult(state_summary=run_data, commands=commands, parameters=[])

    def get_command_slice(
        self,
        cursor: Optional[int],
        length: int,
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.
        """
        return self.run_orchestrator.get_command_slice(cursor=cursor, length=length)

    def get_current_command(self) -> Optional[CommandPointer]:
        """Get the current running command."""
        return self.run_orchestrator.get_current_command()

    def get_command_recovery_target(self) -> Optional[CommandPointer]:
        """Get the current error recovery target."""
        return self.run_orchestrator.get_command_recovery_target()

    def get_command(self, command_id: str) -> Command:
        """Get a run's command by ID."""
        return self.run_orchestrator.get_command(command_id=command_id)

    def get_state_summary(self) -> StateSummary:
        """Get protocol run data."""
        return self.run_orchestrator.get_state_summary()

    async def add_command_and_wait_for_interval(
        self,
        request: CommandCreate,
        wait_until_complete: bool = False,
        timeout: Optional[int] = None,
    ) -> Command:
        """Add a new command to execute and wait for it to complete if needed."""
        return await self.run_orchestrator.add_command_and_wait_for_interval(
            command=request, wait_until_complete=wait_until_complete, timeout=timeout
        )

    def add_labware_offset(self, request: LabwareOffsetCreate) -> LabwareOffset:
        """Add a new labware offset to state."""
        return self.run_orchestrator.add_labware_offset(request)

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a new labware definition to state."""
        return self.run_orchestrator.add_labware_definition(definition)