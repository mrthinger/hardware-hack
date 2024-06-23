"""Liquid Sense OT3."""
from opentrons.protocol_api import ProtocolContext, OFF_DECK

metadata = {"protocolName": "liquid-sense-ot3-p50-single-vial"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

SLOT_SCALE = 1
SLOT_DIAL = 9
SLOTS_TIPRACK = {
    50: [3],
}
LABWARE_ON_SCALE = "radwag_pipette_calibration_vial"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_trash_bin("A3")
    vial = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)
    pipette = ctx.load_instrument("flex_1channel_50", "left")
    for size, slots in SLOTS_TIPRACK.items():
        for slot in slots:
            rack = ctx.load_labware(f"opentrons_flex_96_tiprack_{size}uL", slot)
            pipette.pick_up_tip(rack["A1"])
            pipette.aspirate(10, vial["A1"].top())
            pipette.dispense(10, vial["A1"].top())
            pipette.aspirate(10, dial["A1"].top())
            pipette.dispense(10, dial["A1"].top())
            pipette.drop_tip(trash)
            ctx.move_labware(rack, OFF_DECK)
