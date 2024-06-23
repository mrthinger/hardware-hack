"""Protocol Engine CommandStore sub-state."""
from collections import OrderedDict
from dataclasses import dataclass
from typing import Dict, List, Optional

from opentrons.ordered_set import OrderedSet
from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError

from ..commands import Command, CommandStatus, CommandIntent


@dataclass(frozen=True)
class CommandEntry:
    """A command entry in state, including its index in the list."""

    command: Command
    index: int


@dataclass  # dataclass for __eq__() autogeneration.
class CommandHistory:
    """Command state container for command data."""

    _all_command_ids: List[str]
    """All command IDs, in insertion order."""

    _commands_by_id: Dict[str, CommandEntry]
    """All command resources, in insertion order, mapped by their unique IDs."""

    _queued_command_ids: OrderedSet[str]
    """The IDs of queued commands, in FIFO order"""

    _queued_setup_command_ids: OrderedSet[str]
    """The IDs of queued setup commands, in FIFO order"""

    _queued_fixit_command_ids: OrderedSet[str]
    """The IDs of queued fixit commands, in FIFO order"""

    _running_command_id: Optional[str]
    """The ID of the currently running command, if any"""

    _terminal_command_id: Optional[str]
    """ID of the most recent command that SUCCEEDED or FAILED, if any"""

    def __init__(self) -> None:
        self._all_command_ids = []
        self._queued_command_ids = OrderedSet()
        self._queued_setup_command_ids = OrderedSet()
        self._queued_fixit_command_ids = OrderedSet()
        self._commands_by_id = OrderedDict()
        self._running_command_id = None
        self._terminal_command_id = None

    def length(self) -> int:
        """Get the length of all elements added to the history."""
        return len(self._commands_by_id)

    def has(self, command_id: str) -> bool:
        """Returns whether a command is in the history."""
        return command_id in self._commands_by_id

    def get(self, command_id: str) -> CommandEntry:
        """Get a command entry if present, otherwise raise an exception."""
        try:
            return self._commands_by_id[command_id]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")

    def get_next(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which follows the command associated with the given ID, if any."""
        index = self.get(command_id).index
        try:
            return self._commands_by_id[self._all_command_ids[index + 1]]
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")
        except IndexError:
            return None

    def get_prev(self, command_id: str) -> Optional[CommandEntry]:
        """Get the command which precedes the command associated with the given ID, if any.

        Returns None if the command_id corresponds to the first element in the history.
        """
        index = self.get(command_id).index
        try:
            prev_command = self._commands_by_id[self._all_command_ids[index - 1]]
            return prev_command if index != 0 else None
        except KeyError:
            raise CommandDoesNotExistError(f"Command {command_id} does not exist")
        except IndexError:
            return None

    def get_if_present(self, command_id: str) -> Optional[CommandEntry]:
        """Get a command entry, if present."""
        return self._commands_by_id.get(command_id)

    def get_all_commands(self) -> List[Command]:
        """Get all commands."""
        return [
            self._commands_by_id[command_id].command
            for command_id in self._all_command_ids
        ]

    def get_all_ids(self) -> List[str]:
        """Get all command IDs."""
        return self._all_command_ids

    def get_slice(self, start: int, stop: int) -> List[Command]:
        """Get a list of commands between start and stop."""
        commands = self._all_command_ids[start:stop]
        return [self._commands_by_id[command].command for command in commands]

    def get_tail_command(self) -> Optional[CommandEntry]:
        """Get the command most recently added."""
        if self._commands_by_id:
            return next(reversed(self._commands_by_id.values()))
        else:
            return None

    def get_terminal_command(self) -> Optional[CommandEntry]:
        """Get the command most recently marked as SUCCEEDED or FAILED."""
        if self._terminal_command_id is not None:
            return self._commands_by_id[self._terminal_command_id]
        else:
            return None

    def get_running_command(self) -> Optional[CommandEntry]:
        """Get the command currently running, if any."""
        if self._running_command_id is None:
            return None
        else:
            return self._commands_by_id[self._running_command_id]

    def get_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued protocol commands, in FIFO order."""
        return self._queued_command_ids

    def get_setup_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued setup commands, in FIFO order."""
        return self._queued_setup_command_ids

    def get_fixit_queue_ids(self) -> OrderedSet[str]:
        """Get the IDs of all queued fixit commands, in FIFO order."""
        return self._queued_fixit_command_ids

    def clear_queue(self) -> None:
        """Clears all commands within the queued command ids structure."""
        self._queued_command_ids.clear()

    def clear_setup_queue(self) -> None:
        """Clears all commands within the queued setup command ids structure."""
        self._queued_setup_command_ids.clear()

    def clear_fixit_queue(self) -> None:
        """Clears all commands within the queued setup command ids structure."""
        self._queued_fixit_command_ids.clear()

    def set_command_queued(self, command: Command) -> None:
        """Validate and mark a command as queued in the command history."""
        assert command.status == CommandStatus.QUEUED
        assert not self.has(command.id)

        next_index = self.length()
        updated_command = CommandEntry(
            index=next_index,
            command=command,
        )
        self._add(command.id, updated_command)

        if command.intent == CommandIntent.SETUP:
            self._add_to_setup_queue(command.id)
        elif command.intent == CommandIntent.FIXIT:
            self._add_to_fixit_queue(command.id)
        else:
            self._add_to_queue(command.id)

    def set_command_running(self, command: Command) -> None:
        """Validate and mark a command as running in the command history."""
        prev_entry = self.get(command.id)

        assert prev_entry.command.status == CommandStatus.QUEUED
        assert command.status == CommandStatus.RUNNING

        self._add(
            command.id,
            CommandEntry(index=prev_entry.index, command=command),
        )

        assert self.get_running_command() is None
        self._set_running_command_id(command.id)

        self._remove_queue_id(command.id)
        self._remove_setup_queue_id(command.id)
        self._remove_fixit_queue_id(command.id)

    def set_command_succeeded(self, command: Command) -> None:
        """Validate and mark a command as succeeded in the command history."""
        prev_entry = self.get(command.id)
        assert prev_entry.command.status == CommandStatus.RUNNING
        assert command.status == CommandStatus.SUCCEEDED

        self._add(
            command.id,
            CommandEntry(
                index=prev_entry.index,
                command=command,
            ),
        )

        running_command_entry = self.get_running_command()
        assert running_command_entry is not None
        assert running_command_entry.command.id == command.id
        self._set_running_command_id(None)

        self._remove_queue_id(command.id)
        self._remove_setup_queue_id(command.id)
        self._set_terminal_command_id(command.id)

    def set_command_failed(self, command: Command) -> None:
        """Validate and mark a command as failed in the command history."""
        prev_entry = self.get(command.id)
        assert (
            prev_entry.command.status == CommandStatus.RUNNING
            or prev_entry.command.status == CommandStatus.QUEUED
        )
        assert command.status == CommandStatus.FAILED

        index = self.get(command.id).index
        self._add(
            command_id=command.id,
            command_entry=CommandEntry(index=index, command=command),
        )

        self._set_terminal_command_id(command.id)

        running_command_entry = self.get_running_command()
        if (
            running_command_entry is not None
            and running_command_entry.command.id == command.id
        ):
            self._set_running_command_id(None)

    def _add(self, command_id: str, command_entry: CommandEntry) -> None:
        """Create or update a command entry."""
        if command_id not in self._commands_by_id:
            self._all_command_ids.append(command_id)
        self._commands_by_id[command_id] = command_entry

    def _add_to_queue(self, command_id: str) -> None:
        """Add new ID to the queued."""
        self._queued_command_ids.add(command_id)

    def _add_to_setup_queue(self, command_id: str) -> None:
        """Add a new ID to the queued setup."""
        self._queued_setup_command_ids.add(command_id)

    def _add_to_fixit_queue(self, command_id: str) -> None:
        """Add a new ID to the queued fixit."""
        self._queued_fixit_command_ids.add(command_id)

    def _remove_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued command ids structure."""
        self._queued_command_ids.discard(command_id)

    def _remove_setup_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued setup command ids structure."""
        self._queued_setup_command_ids.discard(command_id)

    def _remove_fixit_queue_id(self, command_id: str) -> None:
        """Remove a specific command from the queued fixit command ids structure."""
        self._queued_fixit_command_ids.discard(command_id)

    def _set_terminal_command_id(self, command_id: str) -> None:
        """Set the ID of the most recently dequeued command."""
        self._terminal_command_id = command_id

    def _set_running_command_id(self, command_id: Optional[str]) -> None:
        """Set the ID of the currently running command."""
        self._running_command_id = command_id
