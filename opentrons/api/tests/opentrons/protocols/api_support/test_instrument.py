import pytest
import logging
from typing import Optional
from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.api_support.instrument import (
    validate_takes_liquid,
    validate_tiprack,
)
from opentrons.types import Location, Point


@pytest.mark.parametrize("reject_module", [True, False])
def test_validate_takes_liquid(ctx: ProtocolContext, reject_module: bool) -> None:
    well_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", 1)
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 2)

    validate_takes_liquid(
        location=Location(Point(1, 2, 3), None),
        reject_module=reject_module,
        reject_adapter=False,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate),
        reject_module=reject_module,
        reject_adapter=False,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate.wells()[0]),
        reject_module=reject_module,
        reject_adapter=False,
    )
    validate_takes_liquid(
        location=well_plate.wells()[0].top(),
        reject_module=reject_module,
        reject_adapter=False,
    )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), tip_rack),
            reject_module=reject_module,
            reject_adapter=False,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), tip_rack.wells()[0]),
            reject_module=reject_module,
            reject_adapter=False,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to a tip rack"):
        validate_takes_liquid(
            location=tip_rack.wells_by_name()["A1"].top(),
            reject_module=reject_module,
            reject_adapter=False,
        )


# TODO(mm, 2023-04-28): The validate_takes_liquid() function is used both by ProtocolContexts
# that are backed by Protocol Engine, and those that aren't. But this test is only runnable
# with a non-Protocol-Engine ProtocolContext because it relies on the internal module.geometry
# property.
#
# Find a different way to test this so that both paths are covered.
@pytest.mark.apiv2_non_pe_only
def test_validate_takes_liquid_module_location(ctx):
    module = ctx.load_module("magdeck", 1)

    validate_takes_liquid(
        location=module.geometry.location,
        reject_module=False,
        reject_adapter=False,
    )

    with pytest.raises(
        ValueError,
        match="Cannot aspirate/dispense directly to a module",
    ):
        validate_takes_liquid(
            location=module.geometry.location,
            reject_module=True,
            reject_adapter=False,
        )


@pytest.mark.ot3_only
def test_validate_takes_liquid_adapter(ctx):
    well_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", 1)
    adapter = ctx.load_adapter("opentrons_96_pcr_adapter", 2)

    validate_takes_liquid(
        location=Location(Point(1, 2, 3), None),
        reject_module=False,
        reject_adapter=True,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate),
        reject_module=False,
        reject_adapter=True,
    )
    validate_takes_liquid(
        location=Location(Point(1, 2, 3), well_plate.wells()[0]),
        reject_module=False,
        reject_adapter=True,
    )
    validate_takes_liquid(
        location=well_plate.wells()[0].top(),
        reject_module=False,
        reject_adapter=True,
    )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to an adapter"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), adapter),
            reject_module=False,
            reject_adapter=True,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to an adapter"):
        validate_takes_liquid(
            location=Location(Point(1, 2, 3), adapter.wells()[0]),
            reject_module=False,
            reject_adapter=True,
        )

    with pytest.raises(ValueError, match="Cannot aspirate/dispense to an adapter"):
        validate_takes_liquid(
            location=adapter.wells_by_name()["A1"].top(),
            reject_module=False,
            reject_adapter=True,
        )


@pytest.mark.parametrize(
    argnames=["pipette_name", "log_value"],
    argvalues=[
        ["p1000_96", None],
        [
            "p50_single_flex",
            "The pipette p50_single_flex and its tip rack opentrons_flex_96_tiprack_200ul appear to be mismatched. Please check your protocol.",
        ],
        [
            "p20_single_gen2",
            "The pipette p20_single_gen2 and its tip rack opentrons_flex_96_tiprack_200ul appear to be mismatched. Please check your protocol.",
        ],
    ],
)
def test_validate_tiprack(
    ctx: ProtocolContext, caplog, pipette_name: str, log_value: Optional[str]
):
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_200ul", 2)

    with caplog.at_level(logging.WARNING):
        log = logging.getLogger(__name__)
        validate_tiprack(pipette_name, tip_rack, log=log)

    if log_value:
        assert caplog.messages[0] == log_value
    else:
        assert caplog.records == []
