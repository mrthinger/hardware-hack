"""Arbitration id tests."""
import pytest
from opentrons_hardware.firmware_bindings import ArbitrationId, ArbitrationIdParts


@pytest.mark.parametrize(
    argnames=["arbitration_id", "expected"],
    argvalues=[
        [
            0x0,
            ArbitrationIdParts(
                function_code=0x0, node_id=0x0, originating_node_id=0, message_id=0
            ),
        ],
        [
            0xFFFFFFFF,
            ArbitrationIdParts(
                function_code=0x7F,
                node_id=0xFF,
                originating_node_id=0xFF,
                message_id=0x3FFF,
            ),
        ],
        [
            0x101821,
            ArbitrationIdParts(
                function_code=0x1, node_id=0x2, originating_node_id=0x3, message_id=0x4
            ),
        ],
    ],
)
def test_arbitration_id_parts(
    arbitration_id: int, expected: ArbitrationIdParts
) -> None:
    """It should convert arbitration id to its parts."""
    c = ArbitrationId(id=arbitration_id)
    assert c.parts == expected


@pytest.mark.parametrize(
    argnames=["expected", "parts"],
    argvalues=[
        [
            0x0,
            ArbitrationIdParts(
                function_code=0x0, node_id=0x0, originating_node_id=0, message_id=0
            ),
        ],
        [
            0x1FFFFFFF,
            ArbitrationIdParts(
                function_code=0x7F,
                node_id=0xFF,
                originating_node_id=0xFF,
                message_id=0x3FFF,
            ),
        ],
        [
            0x101821,
            ArbitrationIdParts(
                function_code=0x1, node_id=0x2, originating_node_id=0x3, message_id=0x4
            ),
        ],
    ],
)
def test_arbitration_id_integer(expected: int, parts: ArbitrationIdParts) -> None:
    """It should convert parts to an arbitration id."""
    c = ArbitrationId(parts=parts)
    assert c.id == expected


def test_arbitration_id_parts_repr_invalid() -> None:
    """It should tolerate invalid ids."""
    # These are not valid enum values. They should display as hex numbers.
    c = ArbitrationIdParts(
        function_code=1, node_id=2, originating_node_id=3, message_id=1000
    )
    assert (
        str(c) == "function_code: sync, node_id: 0x2,"
        " originating_node_id: 0x3, message_id: 0x3e8"
    )
