"""Utilities for reading the current status of the OT3 limit switches."""
import asyncio
import logging
from typing import Dict, Set, Callable, cast

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadLimitSwitchRequest,
    ReadLimitSwitchResponse,
)
from opentrons_hardware.firmware_bindings.constants import NodeId

log = logging.getLogger(__name__)


def _create_listener(
    nodes: Set[NodeId], event: asyncio.Event, responses: Dict[NodeId, int]
) -> Callable[[MessageDefinition, ArbitrationId], None]:
    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            log.warning(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if originator not in nodes:
            log.error(
                "got response from unexpected node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if message.message_id == MessageId.error_message:
            log.error(f"received an error {str(message)}")
            return
        elif message.message_id != MessageId.limit_sw_response:
            log.warning(f"unexpected message id: 0x{message.message_id:x}")
            return
        responses[originator] = cast(
            ReadLimitSwitchResponse, message
        ).payload.switch_status.value
        if len(responses) == len(nodes):
            event.set()

    return _listener


async def get_limit_switches(
    can_messenger: CanMessenger, nodes: Set[NodeId]
) -> Dict[NodeId, int]:
    """Get state of limit switches for each node."""
    event = asyncio.Event()
    responses: Dict[NodeId, int] = dict()
    listener = _create_listener(nodes, event, responses)
    can_messenger.add_listener(listener)
    for node in nodes:
        await can_messenger.send(
            node_id=node,
            message=ReadLimitSwitchRequest(),
        )
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("limit switch request timed out before expected nodes responded")
    finally:
        can_messenger.remove_listener(listener)
    return responses
