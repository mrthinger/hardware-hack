"""Tests for the RobotContextTracker class in performance_metrics.robot_context_tracker."""

import asyncio
from pathlib import Path
import pytest
from performance_metrics.robot_context_tracker import RobotContextTracker
from time import sleep, time_ns
from unittest.mock import patch

# Corrected times in seconds
STARTING_TIME = 0.001
CALIBRATING_TIME = 0.002
ANALYZING_TIME = 0.003
RUNNING_TIME = 0.004
SHUTTING_DOWN_TIME = 0.005


@pytest.fixture
def robot_context_tracker(tmp_path: Path) -> RobotContextTracker:
    """Fixture to provide a fresh instance of RobotContextTracker for each test."""
    return RobotContextTracker(storage_location=tmp_path, should_track=True)


async def test_robot_context_tracker(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the tracking of various robot context states through RobotContextTracker."""

    @robot_context_tracker.track(state="ROBOT_STARTING_UP")
    async def starting_robot() -> str:
        sleep(STARTING_TIME)
        return "Robot is starting up."

    @robot_context_tracker.track(state="CALIBRATING")
    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    @robot_context_tracker.track(state="ANALYZING_PROTOCOL")
    def analyzing_protocol() -> None:
        sleep(ANALYZING_TIME)

    @robot_context_tracker.track(state="RUNNING_PROTOCOL")
    async def running_protocol(run_time: int) -> int:
        sleep(RUNNING_TIME)

        return run_time

    @robot_context_tracker.track(state="ROBOT_SHUTTING_DOWN")
    def shutting_down_robot() -> str:
        sleep(SHUTTING_DOWN_TIME)
        return "Robot is shutting down."

    # Ensure storage is initially empty
    assert (
        len(robot_context_tracker._store._data) == 0
    ), "Storage should be initially empty."

    assert await starting_robot() == "Robot is starting up.", "Operation should return."
    calibrating_robot()
    analyzing_protocol()
    assert await running_protocol(5) == 5
    assert (
        shutting_down_robot() == "Robot is shutting down."
    ), "Operation should return."

    # Verify that all states were tracked
    assert len(robot_context_tracker._store._data) == 5, "All states should be tracked."

    # Validate the sequence and accuracy of tracked states
    expected_states = [
        "ROBOT_STARTING_UP",
        "CALIBRATING",
        "ANALYZING_PROTOCOL",
        "RUNNING_PROTOCOL",
        "ROBOT_SHUTTING_DOWN",
    ]
    for i, state in enumerate(expected_states):
        assert (
            robot_context_tracker._store._data[i].state == state
        ), f"State at index {i} should be {state}."


async def test_multiple_operations_single_state(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking multiple operations within a single robot context state."""

    async def first_operation() -> None:
        sleep(RUNNING_TIME)

    @robot_context_tracker.track(state="RUNNING_PROTOCOL")
    def second_operation() -> None:
        sleep(RUNNING_TIME)

    wrapped_first_operation = robot_context_tracker.track(state="RUNNING_PROTOCOL")(
        first_operation
    )
    await wrapped_first_operation()
    second_operation()

    assert (
        len(robot_context_tracker._store._data) == 2
    ), "Both operations should be tracked."
    assert (
        robot_context_tracker._store._data[0].state
        == robot_context_tracker._store._data[1].state
        == "RUNNING_PROTOCOL"
    ), "Both operations should have the same state."


async def test_exception_handling_in_tracked_function(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Ensures exceptions in tracked operations are handled correctly."""

    @robot_context_tracker.track(state="ROBOT_SHUTTING_DOWN")
    async def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        await error_prone_operation()

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Failed operation should still be tracked."
    assert (
        robot_context_tracker._store._data[0].state == "ROBOT_SHUTTING_DOWN"
    ), "State should be correctly logged despite the exception."


@pytest.mark.asyncio
async def test_async_operation_tracking(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking of an asynchronous operation."""

    @robot_context_tracker.track(state="ANALYZING_PROTOCOL")
    async def async_analyzing_operation() -> None:
        await asyncio.sleep(ANALYZING_TIME)

    await async_analyzing_operation()

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Async operation should be tracked."
    assert (
        robot_context_tracker._store._data[0].state == "ANALYZING_PROTOCOL"
    ), "State should be ANALYZING_PROTOCOL."


def test_sync_operation_timing_accuracy(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the timing accuracy of a synchronous operation tracking."""

    @robot_context_tracker.track(state="RUNNING_PROTOCOL")
    def running_operation() -> None:
        sleep(RUNNING_TIME)

    running_operation()

    duration_data = robot_context_tracker._store._data[0]
    assert (
        abs(duration_data.duration - RUNNING_TIME * 1e9) < 1e7
    ), "Measured duration for sync operation should closely match the expected duration."


@pytest.mark.asyncio
async def test_async_operation_timing_accuracy(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests the timing accuracy of an async operation tracking."""

    @robot_context_tracker.track(state="RUNNING_PROTOCOL")
    async def async_running_operation() -> None:
        await asyncio.sleep(RUNNING_TIME)

    await async_running_operation()

    duration_data = robot_context_tracker._store._data[0]
    assert (
        abs(duration_data.duration - RUNNING_TIME * 1e9) < 1e7
    ), "Measured duration for async operation should closely match the expected duration."


@pytest.mark.asyncio
async def test_exception_in_async_operation(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Ensures exceptions in tracked async operations are correctly handled."""

    @robot_context_tracker.track(state="ROBOT_SHUTTING_DOWN")
    async def async_error_prone_operation() -> None:
        await asyncio.sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated async operation failure")

    with pytest.raises(RuntimeError):
        await async_error_prone_operation()

    assert (
        len(robot_context_tracker._store._data) == 1
    ), "Failed async operation should still be tracked."
    assert (
        robot_context_tracker._store._data[0].state == "ROBOT_SHUTTING_DOWN"
    ), "State should be ROBOT_SHUTTING_DOWN despite the exception."


@pytest.mark.asyncio
async def test_concurrent_async_operations(
    robot_context_tracker: RobotContextTracker,
) -> None:
    """Tests tracking of concurrent async operations."""

    @robot_context_tracker.track(state="CALIBRATING")
    async def first_async_calibrating() -> None:
        await asyncio.sleep(CALIBRATING_TIME)

    @robot_context_tracker.track(state="CALIBRATING")
    async def second_async_calibrating() -> None:
        await asyncio.sleep(CALIBRATING_TIME)

    await asyncio.gather(first_async_calibrating(), second_async_calibrating())

    assert (
        len(robot_context_tracker._store._data) == 2
    ), "Both concurrent async operations should be tracked."
    assert all(
        data.state == "CALIBRATING" for data in robot_context_tracker._store._data
    ), "All tracked operations should be in CALIBRATING state."


def test_no_tracking(tmp_path: Path) -> None:
    """Tests that operations are not tracked when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    @robot_context_tracker.track(state="ROBOT_STARTING_UP")
    def operation_without_tracking() -> None:
        sleep(STARTING_TIME)

    operation_without_tracking()

    assert (
        len(robot_context_tracker._store._data) == 0
    ), "Operation should not be tracked when tracking is disabled."


@pytest.mark.asyncio
async def test_async_exception_handling_when_not_tracking(tmp_path: Path) -> None:
    """Ensures exceptions in operations are still raised when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    @robot_context_tracker.track(state="ROBOT_SHUTTING_DOWN")
    async def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        await error_prone_operation()


def test_sync_exception_handling_when_not_tracking(tmp_path: Path) -> None:
    """Ensures exceptions in operations are still raised when tracking is disabled."""
    robot_context_tracker = RobotContextTracker(tmp_path, should_track=False)

    @robot_context_tracker.track(state="ROBOT_SHUTTING_DOWN")
    def error_prone_operation() -> None:
        sleep(SHUTTING_DOWN_TIME)
        raise RuntimeError("Simulated operation failure")

    with pytest.raises(RuntimeError):
        error_prone_operation()


@patch(
    "performance_metrics.robot_context_tracker._get_timing_function",
    return_value=time_ns,
)
def test_using_non_linux_time_functions(tmp_path: Path) -> None:
    """Tests tracking operations using non-Linux time functions."""
    file_path = tmp_path / "test_file.csv"
    robot_context_tracker = RobotContextTracker(file_path, should_track=True)

    @robot_context_tracker.track(state="ROBOT_STARTING_UP")
    def starting_robot() -> None:
        sleep(STARTING_TIME)

    @robot_context_tracker.track(state="CALIBRATING")
    def calibrating_robot() -> None:
        sleep(CALIBRATING_TIME)

    starting_robot()
    calibrating_robot()

    storage = robot_context_tracker._store._data
    assert all(
        data.func_start > 0 for data in storage
    ), "All function start times should be greater than 0."
    assert all(
        data.duration > 0 for data in storage
    ), "All duration times should be greater than 0."
    assert len(storage) == 2, "Both operations should be tracked."
