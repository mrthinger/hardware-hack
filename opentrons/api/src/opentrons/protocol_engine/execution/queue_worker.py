"""Command queue execution worker module."""
import asyncio
from logging import getLogger
from typing import Optional

from ..state import StateStore
from ..errors import RunStoppedError
from .command_executor import CommandExecutor


log = getLogger(__name__)


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    def __init__(
        self,
        state_store: StateStore,
        command_executor: CommandExecutor,
    ) -> None:
        """Initialize the queue worker's dependencies and state.

        Arguments:
            state_store: The source of truth for protocol state, including
                all queued commands.
            command_executor: Interface used to execute and update commands.
        """
        self._state_store: StateStore = state_store
        self._command_executor: CommandExecutor = command_executor
        self._worker_task: Optional["asyncio.Task[None]"] = None

    def start(self) -> None:
        """Start processing jobs.

        This method will no-op if the worker is already running.
        """
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._run_commands())

    def cancel(self) -> None:
        """Cancel any in-progress commands.

        This method is synchronous to allow synchronous callers to
        cancel the ongoing background task in situations where it
        needs to happen immediately.

        You should call `join` after calling `cancel` to clean up and
        propagate errors.
        """
        if self._worker_task:
            self._worker_task.cancel()

    async def join(self) -> None:
        """Wait for the worker to finish, propagating any errors."""
        worker_task = self._worker_task

        if worker_task:
            self._worker_task = None

            try:
                await worker_task
            except asyncio.CancelledError:  # From self.cancel().
                pass
            except Exception as e:
                log.error("Unhandled exception in QueueWorker job", exc_info=e)
                raise e

    async def _run_commands(self) -> None:
        while True:
            try:
                command_id = await self._state_store.wait_for(
                    condition=self._state_store.commands.get_next_to_execute
                )
                # Assert for type hinting. This is valid because the wait_for() above
                # only returns when the value is truthy.
                assert command_id is not None
            except RunStoppedError:
                # There are no more commands that we should execute, either because the run has
                # completed on its own, or because a client requested it to stop.
                break
            else:
                await self._command_executor.execute(command_id=command_id)
                # Yield to the event loop in case we're executing a long sequence of commands
                # that never yields internally. For example, a long sequence of comment commands.
                await asyncio.sleep(0)
