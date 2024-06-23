"""Integration tests for the can_comm script."""
from typing import List

from mock import MagicMock

import pytest

from opentrons_hardware.firmware_bindings.message import (
    CanMessage,
)
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    GetStatusResponsePayload,
)
from opentrons_hardware.scripts import can_comm
from opentrons_hardware.firmware_bindings.constants import MessageId, NodeId


@pytest.fixture
def mock_get_input() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=input)


@pytest.fixture
def mock_output() -> MagicMock:
    """Mock get input."""
    return MagicMock(spec=print)


def test_prompt_message_without_payload(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should create a message without payload."""
    message_id = MessageId.get_status_request
    node_id = NodeId.pipette_left
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
        "1",
    ]
    r = can_comm.prompt_message(mock_get_input, mock_output)
    assert r == CanMessage(
        arbitration_id=ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message_id, node_id=node_id, originating_node_id=NodeId.host
            )
        ),
        data=b"\x00\x00\x00\x01",
    )


def test_prompt_message_with_payload(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should send a message with payload."""
    message_id = MessageId.write_motor_current_request
    node_id = NodeId.pipette_left
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
        "1",
        str(0xFF00FF00),
        str(0xAA00BB00),
    ]
    r = can_comm.prompt_message(mock_get_input, mock_output)
    assert r == CanMessage(
        arbitration_id=ArbitrationId(
            parts=ArbitrationIdParts(
                message_id=message_id, node_id=node_id, originating_node_id=NodeId.host
            )
        ),
        data=b"\x00\x00\x00\x01\xff\x00\xff\x00\xAA\00\xBB\x00",
    )


@pytest.mark.parametrize(
    argnames=["user_input"],
    argvalues=[
        # Not a number
        [["b", "2"]],
        # Out of range
        [["1000000000", "2"]],
    ],
)
def test_prompt_enum_bad_input(
    user_input: List[str], mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should not raise on bad input but wait until input is good."""
    mock_get_input.side_effect = user_input
    parsed_id = can_comm.prompt_enum(MessageId, mock_get_input, mock_output)
    assert mock_get_input.call_count == 2
    assert parsed_id == MessageId.device_info_request


@pytest.mark.parametrize(
    argnames=["user_input"],
    argvalues=[
        # Not a number
        [["b"]],
    ],
)
def test_prompt_payload_bad_input(
    user_input: List[str], mock_get_input: MagicMock
) -> None:
    """It should raise on bad input."""
    mock_get_input.side_effect = user_input
    with pytest.raises(can_comm.InvalidInput):
        can_comm.prompt_payload(GetStatusResponsePayload, mock_get_input)


def test_prompt_message_bad_input(
    mock_get_input: MagicMock, mock_output: MagicMock
) -> None:
    """It should raise on bad input."""
    message_id = MessageId.get_status_response
    node_id = NodeId.pipette_right
    mock_get_input.side_effect = [
        str(list(MessageId).index(message_id)),
        str(list(NodeId).index(node_id)),
        "1",
        "-123",
        # out of range for Uint32
        str(0x1FF00FF00),
    ]
    with pytest.raises(can_comm.InvalidInput):
        can_comm.prompt_message(mock_get_input, mock_output)
