"""Class to monitor firmware update status."""
from asyncio import Lock, Queue, QueueEmpty
from dataclasses import dataclass
from datetime import datetime
import logging
from typing import (
    Dict,
    TYPE_CHECKING,
    Optional,
    Any,
    Callable,
    Awaitable,
    List,
)

from opentrons.hardware_control.types import (
    SubSystem as HWSubSystem,
)
from opentrons.hardware_control.errors import UpdateOngoingError

from robot_server.service.task_runner import TaskRunner
from .models import SubSystem, UpdateState


log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@dataclass
class ProcessDetails:
    """The static details of an update process that are set when it starts."""

    created_at: datetime
    subsystem: SubSystem
    update_id: str


@dataclass
class UpdateProgress:
    """The current progress of an update process."""

    state: UpdateState
    progress: int
    error: Optional[BaseException]


@dataclass
class UpdateProcessSummary:
    """The full information of an update process."""

    details: ProcessDetails
    progress: UpdateProgress


class NoOngoingUpdate(KeyError):
    """There is no ongoing update for this subsystem."""


class UpdateFailed(RuntimeError):
    """Error raised when the information from hardware controller points to a failed update."""


class UpdateIdNotFound(KeyError):
    """This update ID was not found."""


class UpdateIdExists(ValueError):
    """There is already an entry for this update key."""


class UncontrolledUpdateInProgress(RuntimeError):
    """An update process started by something other than the server is running."""

    def __init__(self, subsystem: SubSystem) -> None:
        """Build an UncontrolledUpdateInProgressError."""
        super().__init__()
        self.subsystem = subsystem

    def __repr__(self) -> str:
        """Internal string representation of the error."""
        return f"<{self.__class__.__name__}: subsystem={self.subsystem}>"

    def __str__(self) -> str:
        """Public string representation of the error."""
        return f"An update for {self.subsystem} is in progress from another source."


class UpdateInProgress(RuntimeError):
    """Error raised when an update is already ongoing on the same device."""

    def __init__(self, subsystem: SubSystem) -> None:
        """Build an UpdateInProgressError."""
        super().__init__()
        self.subsystem = subsystem

    def __repr__(self) -> str:
        """Internal string representation for the error."""
        return f"<{self.__class__.__name__}: {self.subsystem}>"

    def __str__(self) -> str:
        """Public string representation for the error."""
        return f"Update for {self.subsystem} already in progress"


class SubsystemNotFound(KeyError):
    """Requested subsystem not attached."""

    def __init__(self, subsystem: SubSystem) -> None:
        """Build a SubsystemNotFoundError."""
        super().__init__()
        self.subsystem = subsystem

    def __repr__(self) -> str:
        """Internal string representation for the error."""
        return f"<{self.__class__.__name__}: {self.subsystem}>"

    def __str__(self) -> str:
        """Public string representation for the error."""
        return f"Subsystem {self.subsystem} is not attached"


class _UpdateProcess:
    """State storage and routing for a firmware update."""

    _status_queue: "Queue[UpdateProgress]"
    _hw_handle: "OT3API"
    _subsystem: HWSubSystem
    _status_cache: Optional[UpdateProgress]
    _created_at: datetime
    _update_id: str
    _complete_callback: Callable[[], Awaitable[None]]

    def __init__(
        self,
        hw_handle: "OT3API",
        subsystem: HWSubSystem,
        created_at: datetime,
        update_id: str,
        complete_callback: Callable[[], Awaitable[None]],
        status_cache: Optional[UpdateProgress] = None,
    ) -> None:
        """Build an _UpdateProcess. Should only be done by the manager."""
        self._status_queue = Queue()
        self._hw_handle = hw_handle
        self._subsystem = subsystem
        self._status_cache = status_cache
        self._status_cache_lock = Lock()
        self._created_at = created_at
        self._update_id = update_id
        self._complete_callback = complete_callback

    @property
    def status_cache(self) -> UpdateProgress:
        """Get the last status from the worker task.

        Note: this may not be up to date unless you've called provide_latest_progress.
        """
        if not self._status_cache:
            raise RuntimeError(
                "Update process was not started before asking for status"
            )
        return self._status_cache

    @property
    def created_at(self) -> datetime:
        """The time at which the process began."""
        return self._created_at

    @property
    def subsystem(self) -> HWSubSystem:
        """The subsystem that is being upated."""
        return self._subsystem

    @property
    def update_id(self) -> str:
        """The ID of the update task."""
        return self._update_id

    async def _update_task(self) -> None:
        last_progress = 0
        try:
            async for update in self._hw_handle.update_firmware({self.subsystem}):
                last_progress = update.progress
                await self._status_queue.put(
                    UpdateProgress(
                        UpdateState.from_hw(update.state), last_progress, None
                    )
                )
            last_progress = 100
            await self._status_queue.put(UpdateProgress(UpdateState.done, 100, None))
        except UpdateOngoingError:
            log.exception(f"Update was already in progress for {self.subsystem.value}")
            await self._status_queue.put(
                UpdateProgress(
                    UpdateState.failed,
                    0,
                    UncontrolledUpdateInProgress(SubSystem.from_hw(self.subsystem)),
                )
            )
        except BaseException as be:
            log.exception("Failed to update firmware")
            await self._status_queue.put(
                UpdateProgress(UpdateState.failed, last_progress, be)
            )
        finally:
            await self._complete_callback()

    def get_handle(self) -> "UpdateProcessHandle":
        """Get a public handle for the task that is usable elsewhere.

        Handles of this type should be the only way code from outside this module interacts with
        an UpdateProcess.
        """
        return UpdateProcessHandle(self)

    async def provide_latest_progress(self) -> UpdateProgress:
        """Updates the status cache with the latest update if there is one."""
        while self._status_cache is None:
            self._status_cache = await self._status_queue.get()
        maybe_latest = self._drain_queue_provide_last()
        if maybe_latest:
            self._status_cache = maybe_latest

        return self.status_cache

    def _drain_queue_provide_last(self) -> Optional[UpdateProgress]:
        """Drains the status queue to provide the latest update.

        Note that this code does not yield. It should be acceptably fast because get_nowait() is
        designed for this; and the lack of yielding makes this function as a whole atomic in an
        async context. If multiple tasks call this function, the first to do so gets the update and
        the rest get None.
        """
        packet: Optional[UpdateProgress] = None
        while True:
            try:
                packet = self._status_queue.get_nowait()
            except QueueEmpty:
                return packet


class UpdateProcessHandle:
    """The external interface to get status notifications from the update process."""

    _update_proc: _UpdateProcess
    _proc_details: ProcessDetails

    def __init__(self, update_proc: _UpdateProcess) -> None:
        self._update_proc = update_proc
        self._proc_details = ProcessDetails(
            update_proc.created_at,
            SubSystem.from_hw(update_proc.subsystem),
            update_proc.update_id,
        )

    async def get_progress(self) -> UpdateProgress:
        """Get the progress of the update process for which this is a handle.

        This function is async-reentrant in that each call will provide the latest status at that
        time, though each call may return something different depending on when they're called.

        Normal progress updates are returned; this function may also raise an exception that has
        been conveyed from inside the update process.
        """
        return await self._update_proc.provide_latest_progress()

    @property
    def process_details(self) -> ProcessDetails:
        """Get the static process details for the process for which this is a handle."""
        return self._proc_details

    @property
    def cached_state(self) -> UpdateState:
        """Get the last cached state of the update.

        This may be out of date if the process is ongoing and get_progress() has not recently been
        called on this or another handle, but if the process is complete then it will say done.
        """
        return self._update_proc.status_cache.state

    async def get_process_summary(self) -> UpdateProcessSummary:
        """Get a full summary, inclusive of static details and progress, for the handled process."""
        return UpdateProcessSummary(self.process_details, await self.get_progress())

    def __eq__(self, other: Any) -> bool:
        """This eq overload makes handles equal if they refer to the same process."""
        if isinstance(other, UpdateProcessHandle):
            return self._update_proc is other._update_proc
        return NotImplemented


class FirmwareUpdateManager:
    """State storage and progress monitoring for instrument firmware updates."""

    _all_updates_by_id: Dict[str, _UpdateProcess]
    #: A store for any updates that are currently running, by their process id
    _running_updates_by_subsystem: Dict[HWSubSystem, _UpdateProcess]
    #: A store for any updates that are currently running, by subsystem
    _management_lock: Lock
    #: A lock for accessing the store, mostly to avoid spurious toctou problems with it

    _task_runner: TaskRunner
    _hardware_handle: "OT3API"

    def __init__(
        self,
        task_runner: TaskRunner,
        hw_handle: "OT3API",
    ) -> None:
        self._all_updates_by_id = {}
        self._running_updates_by_subsystem = {}
        self._task_runner = task_runner
        self._management_lock = Lock()
        self._hardware_handle = hw_handle

    async def _get_by_id(self, update_id: str) -> _UpdateProcess:
        async with self._management_lock:
            try:
                return self._all_updates_by_id[update_id]
            except KeyError as e:
                raise UpdateIdNotFound() from e

    async def _emplace(
        self, update_id: str, subsystem: SubSystem, creation_time: datetime
    ) -> _UpdateProcess:
        hw_subsystem = subsystem.to_hw()

        if hw_subsystem not in self._hardware_handle.attached_subsystems:
            raise SubsystemNotFound(subsystem)

        if update_id in self._all_updates_by_id:
            raise UpdateIdExists()

        if hw_subsystem in self._running_updates_by_subsystem:
            raise UpdateInProgress(subsystem)

        async def _complete() -> None:
            async with self._management_lock:
                try:
                    process = self._running_updates_by_subsystem.pop(hw_subsystem)
                    # make sure this process gets its progress updated since nothing may
                    # update it from the route handler after this
                    await process.provide_latest_progress()
                except KeyError:
                    log.exception(f"Double pop for update on {subsystem}")

        self._all_updates_by_id[update_id] = _UpdateProcess(
            self._hardware_handle,
            hw_subsystem,
            creation_time,
            update_id,
            _complete,
            UpdateProgress(UpdateState.queued, 0, None),
        )
        self._running_updates_by_subsystem[hw_subsystem] = self._all_updates_by_id[
            update_id
        ]
        self._task_runner.run(self._all_updates_by_id[update_id]._update_task)
        return self._all_updates_by_id[update_id]

    def get_update_process_handle_by_id(self, update_id: str) -> UpdateProcessHandle:
        """Get a handle for a process by its update id.

        Note that process are kept around basically forever (program lifetime) by id, to allow for
        clients that weren't around at the moment of completion to still retrieve the completion outcome.

        This is the way to get access to a running process - the process object itself should
        not be touched outside this object or the task runner.
        """
        try:
            return self._all_updates_by_id[update_id].get_handle()
        except KeyError as ke:
            raise UpdateIdNotFound() from ke

    async def get_ongoing_update_process_handle_by_subsystem(
        self, subsystem: SubSystem
    ) -> UpdateProcessHandle:
        """Get a handle for a process by its subsystem.

        This is the way to get access to a running process - the process object itself should
        not be touched outside this object or the task runner.
        """
        async with self._management_lock:
            try:
                return self._running_updates_by_subsystem[
                    subsystem.to_hw()
                ].get_handle()
            except KeyError as ke:
                raise NoOngoingUpdate() from ke

    async def all_ongoing_processes(
        self,
    ) -> List[UpdateProcessHandle]:
        """Return handles for all ongoing updates."""
        async with self._management_lock:
            return list(
                update.get_handle()
                for update in self._running_updates_by_subsystem.values()
            )

    def all_update_processes(self) -> List[UpdateProcessHandle]:
        """Return handles for all historical updates."""
        return list(update.get_handle() for update in self._all_updates_by_id.values())

    async def start_update_process(
        self,
        update_id: str,
        subsystem: SubSystem,
        created_at: datetime,
    ) -> UpdateProcessHandle:
        """Try to begin an update process, checking preconditions, and return a handle if successful.

        This function is responsible for checking hardware preconditions: does the requested instrument
        exist, etc. It also will start an update process and convey any exceptions that are raised
        immediately (though later exceptions may need to be found by getting progress through the
        handle).
        """
        async with self._management_lock:
            process = await self._emplace(update_id, subsystem, created_at)
            await process.provide_latest_progress()
        return process.get_handle()
