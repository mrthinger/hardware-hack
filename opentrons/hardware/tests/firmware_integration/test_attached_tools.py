"""Test for attached tool request."""
import asyncio
import pytest

from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings import NodeId, ArbitrationId
from opentrons_hardware.firmware_bindings.constants import ToolType
from opentrons_hardware.firmware_bindings.messages.fields import ToolField
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    AttachedToolsRequest,
    PushToolsDetectedNotification,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    ToolsDetectedNotificationPayload,
)


def filter_func(arb: ArbitrationId) -> bool:
    """Message filtering function."""
    return bool(arb.parts.message_id == PushToolsDetectedNotification.message_id)


@pytest.mark.requires_emulator
@pytest.mark.can_filter_func.with_args(filter_func)
async def test_attached_tools_request(
    can_messenger: CanMessenger,
    can_messenger_queue: WaitableCallback,
) -> None:
    """It should respond with a push tools detectioned notification."""
    msg = AttachedToolsRequest()

    await can_messenger.send(node_id=NodeId.head, message=msg)

    message, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    expected_payload = ToolsDetectedNotificationPayload(
        z_motor=ToolField(ToolType.nothing_attached),
        a_motor=ToolField(ToolType.tool_error),
        gripper=ToolField(ToolType.nothing_attached),
    )

    assert arbitration_id.parts.message_id == PushToolsDetectedNotification.message_id
    assert arbitration_id.parts.originating_node_id == NodeId.head
    assert arbitration_id.parts.node_id == NodeId.host
    assert message.payload == expected_payload
