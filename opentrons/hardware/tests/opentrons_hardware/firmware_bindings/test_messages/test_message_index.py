"""Tests for can message_index generator."""
from opentrons_hardware.firmware_bindings import utils

from opentrons_hardware.firmware_bindings.messages import message_definitions, payloads


def test_unqiue_index() -> None:
    """Create several messages and make sure they have generate a new index."""
    last_index = utils.UInt32Field(0)
    for i in range(1, 20):
        # we have to define a payload here because python reuses
        # old memory locations for the HeartbeatRequest from other tests that
        # already have a message index
        message = message_definitions.HeartbeatRequest(payload=payloads.EmptyPayload())
        assert message.payload.message_index != last_index
        last_index = message.payload.message_index
