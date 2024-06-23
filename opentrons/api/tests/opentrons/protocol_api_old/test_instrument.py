""" Test the InstrumentContext class and its functions """
import pytest
from unittest import mock

from opentrons.types import Mount
from opentrons.protocols.advanced_control import transfers
from opentrons.protocols.api_support.types import APIVersion

import opentrons.protocol_api as papi

pytestmark = pytest.mark.ot2_only


@pytest.fixture
def make_context_and_labware(hardware, deck_definition_name):
    def _make_context_and_labware(api_version):
        ctx = papi.create_protocol_context(
            api_version=api_version,
            hardware_api=hardware,
            deck_type=deck_definition_name,
        )
        lw1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1)
        instr = ctx.load_instrument("p300_single", Mount.RIGHT)

        return {"ctx": ctx, "instr": instr, "lw1": lw1}

    return _make_context_and_labware


@pytest.mark.parametrize(
    "liquid_handling_command", ["transfer", "consolidate", "distribute"]
)
def test_blowout_location_unsupported_version(
    make_context_and_labware, liquid_handling_command
):
    # not supported in versions below 2.8
    context_and_labware = make_context_and_labware(APIVersion(2, 7))
    context_and_labware["ctx"].home()
    lw1 = context_and_labware["lw1"]
    instr = context_and_labware["instr"]
    with pytest.raises(
        ValueError,
        match="Cannot specify blowout location when using api version "
        + "below 2.8, current version is 2.7",
    ):
        getattr(instr, liquid_handling_command)(
            100, lw1["A1"], lw1["A2"], blowout_location="should not matter"
        )


@pytest.mark.parametrize(
    argnames="liquid_handling_command," "blowout_location," "expected_error_match,",
    argvalues=[
        ["transfer", "some invalid location", "blowout location should be either"],
        [
            "consolidate",
            "source well",
            "blowout location for consolidate cannot be source well",
        ],
        [
            "distribute",
            "destination well",
            "blowout location for distribute cannot be destination well",
        ],
    ],
)
def test_blowout_location_invalid(
    make_context_and_labware,
    liquid_handling_command,
    blowout_location,
    expected_error_match,
):
    context_and_labware = make_context_and_labware(APIVersion(2, 8))
    context_and_labware["ctx"].home()
    lw1 = context_and_labware["lw1"]
    instr = context_and_labware["instr"]
    with pytest.raises(ValueError, match=expected_error_match):

        getattr(instr, liquid_handling_command)(
            100, lw1["A1"], lw1["A2"], blowout_location=blowout_location
        )


@pytest.mark.parametrize(
    argnames="liquid_handling_command," "blowout_location," "expected_strat,",
    argvalues=[
        ["transfer", "destination well", transfers.BlowOutStrategy.DEST],
        ["transfer", "source well", transfers.BlowOutStrategy.SOURCE],
        ["transfer", "trash", transfers.BlowOutStrategy.TRASH],
        ["consolidate", "destination well", transfers.BlowOutStrategy.DEST],
        ["consolidate", "trash", transfers.BlowOutStrategy.TRASH],
        ["distribute", "source well", transfers.BlowOutStrategy.SOURCE],
        ["distribute", "trash", transfers.BlowOutStrategy.TRASH],
    ],
)
def test_valid_blowout_location(
    make_context_and_labware, liquid_handling_command, blowout_location, expected_strat
):
    context_and_labware = make_context_and_labware(APIVersion(2, 8))
    context_and_labware["ctx"].home()
    lw1 = context_and_labware["lw1"]
    instr = context_and_labware["instr"]

    with mock.patch.object(papi.InstrumentContext, "_execute_transfer") as patch:
        getattr(instr, liquid_handling_command)(
            100,
            lw1["A2"],
            [lw1["A1"], lw1["B1"]],
            blow_out=True,
            blowout_location=blowout_location,
            new_tip="never",
        )
        blowout_strat = patch.call_args[0][0]._options.transfer.blow_out_strategy

        assert blowout_strat == expected_strat
