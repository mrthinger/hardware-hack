"""Tests for the InstrumentContext public interface."""
from collections import OrderedDict
import inspect

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]
from decoy import Decoy

from opentrons.legacy_broker import LegacyBroker
from typing import ContextManager, Optional
from contextlib import nullcontext as does_not_raise

from opentrons.protocols.api_support import instrument as mock_instrument_support
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import (
    APIVersionError,
    FlowRates,
    PlungerSpeeds,
)
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    InstrumentContext,
    Labware,
    Well,
    labware,
    validation as mock_validation,
)
from opentrons.protocol_api.validation import WellTarget, PointTarget
from opentrons.protocol_api.core.common import InstrumentCore, ProtocolCore
from opentrons.protocol_api.core.legacy.legacy_instrument_core import (
    LegacyInstrumentCore,
)

from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_api.disposal_locations import TrashBin, WasteChute
from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons_shared_data.pipette.pipette_definition import ValidNozzleMaps
from opentrons.types import Location, Mount, Point

from opentrons_shared_data.errors.exceptions import (
    CommandPreconditionViolated,
)


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_instrument_support_module(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(mock_instrument_support, inspect.isfunction):
        monkeypatch.setattr(mock_instrument_support, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_labware_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(labware, inspect.isfunction):
        monkeypatch.setattr(labware, name, decoy.mock(func=func))


@pytest.fixture
def mock_instrument_core(decoy: Decoy) -> InstrumentCore:
    """Get a mock instrument implementation core."""
    instrument_core = decoy.mock(cls=InstrumentCore)
    decoy.when(instrument_core.get_mount()).then_return(Mount.LEFT)
    return instrument_core


@pytest.fixture
def mock_legacy_instrument_core(decoy: Decoy) -> LegacyInstrumentCore:
    """Get a mock instrument implementation core."""
    instrument_core = decoy.mock(cls=LegacyInstrumentCore)
    decoy.when(instrument_core.get_mount()).then_return(Mount.LEFT)
    return instrument_core


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock ProtocolCore."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def mock_trash(decoy: Decoy) -> Labware:
    """Get a mock fixed-trash labware."""
    return decoy.mock(cls=Labware)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    mock_instrument_core: InstrumentCore,
    mock_protocol_core: ProtocolCore,
    mock_broker: LegacyBroker,
    mock_trash: Labware,
    api_version: APIVersion,
) -> InstrumentContext:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    return InstrumentContext(
        core=mock_instrument_core,
        protocol_core=mock_protocol_core,
        broker=mock_broker,
        api_version=api_version,
        tip_racks=[],
        trash=mock_trash,
        requested_as="requested-pipette-name",
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: InstrumentContext) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


@pytest.mark.parametrize("channels_from_core", [1, 8, 96])
def test_channels(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_core: InstrumentCore,
    channels_from_core: int,
) -> None:
    """It should return the number of channels, as returned by the core."""
    decoy.when(mock_instrument_core.get_channels()).then_return(channels_from_core)
    assert subject.channels == channels_from_core


@pytest.mark.parametrize(
    ("channels_from_core", "expected_type"),
    [
        (1, "single"),
        (8, "multi"),
        (96, "multi"),
    ],
)
def test_type(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_core: InstrumentCore,
    channels_from_core: int,
    expected_type: str,
) -> None:
    """It should map the number of channels from the core into the string "single" or "multi"."""
    decoy.when(mock_instrument_core.get_channels()).then_return(channels_from_core)
    assert subject.type == expected_type


def test_trash_container(
    decoy: Decoy,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should have a settable trash_container property."""
    assert subject.trash_container is mock_trash

    other_trash = decoy.mock(cls=Labware)
    subject.trash_container = other_trash

    assert subject.trash_container is other_trash


def test_tip_racks(decoy: Decoy, subject: InstrumentContext) -> None:
    """It should have a settable tip_racks property."""
    assert subject.tip_racks == []

    tip_racks = [decoy.mock(cls=Labware), decoy.mock(cls=Labware)]
    subject.tip_racks = tip_racks

    assert subject.tip_racks == tip_racks


def test_mount(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should have a mount property."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    assert subject.mount == "right"


def test_move_to(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            well_core=None,
            location=location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_move_to_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_well)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            location=location,
            well_core=mock_well._core,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 13)])
def test_pick_up_from_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a specific tip."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_well, presses=1, increment=2.0, prep_after=False)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=1,
            increment=2.0,
            prep_after=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_pick_up_from_well_deprecated_args(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a specific tip."""
    mock_well = decoy.mock(cls=Well)

    with pytest.raises(APIVersionError):
        subject.pick_up_tip(mock_well, presses=1, increment=2.0, prep_after=False)


def test_aspirate(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    bottom_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.bottom(z=1.0)).then_return(bottom_location)
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=bottom_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_from_coordinates(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate from given coordinates."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(PointTarget(location=input_location, in_place=True))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=None,
            in_place=True,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Shound raise a RuntimeError error."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.aspirate(location=None)


def test_blow_out_to_well(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a well."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.top()).then_return(top_location)
    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=top_location, well_core=mock_well._core, in_place=False
        ),
        times=1,
    )


def test_blow_out_to_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a well location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=input_location, well_core=mock_well._core, in_place=False
        ),
        times=1,
    )


def test_blow_out_to_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    point_target = PointTarget(location=input_location, in_place=True)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(point_target)

    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=input_location, well_core=None, in_place=True
        ),
        times=1,
    )


def test_blow_out_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Should raise a RuntimeError."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.blow_out(location=None)


MOCK_MAP = NozzleMap.build(
    physical_nozzles=OrderedDict({"A1": Point(0, 0, 0)}),
    physical_rows=OrderedDict({"A": ["A1"]}),
    physical_columns=OrderedDict({"1": ["A1"]}),
    starting_nozzle="A1",
    back_left_nozzle="A1",
    front_right_nozzle="A1",
    valid_nozzle_maps=ValidNozzleMaps(maps={"Full": ["A1"]}),
)


@pytest.mark.parametrize(
    argnames=["api_version", "mock_map"],
    argvalues=[(APIVersion(2, 18), MOCK_MAP), (APIVersion(2, 17), None)],
)
def test_pick_up_tip_from_labware(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_map: Optional[NozzleMap],
) -> None:
    """It should pick up the next tip from a given labware."""
    mock_tip_rack = decoy.mock(cls=Labware)
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.get_active_channels()).then_return(123)
    decoy.when(mock_instrument_core.get_nozzle_map()).then_return(MOCK_MAP)
    decoy.when(
        labware.next_available_tip(
            starting_tip=None,
            tip_racks=[mock_tip_rack],
            channels=123,
            nozzle_map=mock_map,
        )
    ).then_return((mock_tip_rack, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_tip_rack)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_pick_up_tip_from_well_location(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up the next tip from a given well-based Location."""
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_well)

    subject.pick_up_tip(location)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


@pytest.mark.parametrize(
    argnames=["api_version", "mock_map"],
    argvalues=[(APIVersion(2, 18), MOCK_MAP), (APIVersion(2, 17), None)],
)
def test_pick_up_tip_from_labware_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_map: Optional[NozzleMap],
) -> None:
    """It should pick up the next tip from a given labware-based Location."""
    mock_tip_rack = decoy.mock(cls=Labware)
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_tip_rack)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.get_active_channels()).then_return(123)
    decoy.when(mock_instrument_core.get_nozzle_map()).then_return(MOCK_MAP)
    decoy.when(
        labware.next_available_tip(
            starting_tip=None,
            tip_racks=[mock_tip_rack],
            channels=123,
            nozzle_map=mock_map,
        )
    ).then_return((mock_tip_rack, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(location)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


@pytest.mark.parametrize(
    argnames=["api_version", "mock_map"],
    argvalues=[(APIVersion(2, 18), MOCK_MAP), (APIVersion(2, 17), None)],
)
def test_pick_up_from_associated_tip_racks(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_map: Optional[NozzleMap],
) -> None:
    """It should pick up from its associated tip racks."""
    mock_tip_rack_1 = decoy.mock(cls=Labware)
    mock_tip_rack_2 = decoy.mock(cls=Labware)
    mock_starting_tip = decoy.mock(cls=Well)
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.is_tip_tracking_available()).then_return(True)
    decoy.when(mock_instrument_core.get_active_channels()).then_return(123)
    decoy.when(mock_instrument_core.get_nozzle_map()).then_return(MOCK_MAP)
    decoy.when(
        labware.next_available_tip(
            starting_tip=mock_starting_tip,
            tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
            channels=123,
            nozzle_map=mock_map,
        )
    ).then_return((mock_tip_rack_2, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.starting_tip = mock_starting_tip
    subject.tip_racks = [mock_tip_rack_1, mock_tip_rack_2]
    subject.pick_up_tip()

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_pick_up_fails_when_tip_tracking_unavailable(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should raise an error if automatic tip tracking is not available.."""
    mock_tip_rack_1 = decoy.mock(cls=Labware)

    decoy.when(mock_instrument_core.is_tip_tracking_available()).then_return(False)
    decoy.when(mock_instrument_core.get_active_channels()).then_return(123)

    subject.tip_racks = [mock_tip_rack_1]
    with pytest.raises(
        CommandPreconditionViolated, match="Automatic tip tracking is not available"
    ):
        subject.pick_up_tip()


def test_drop_tip_to_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should drop a tip in a specific well."""
    mock_well = decoy.mock(cls=Well)

    subject.drop_tip(mock_well, home_after=False)

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=False,
            alternate_drop_location=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_drop_tip_to_trash(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in the trash if not given a location ."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_trash.wells()).then_return([mock_well])

    subject.drop_tip()

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 15)])
def test_drop_tip_to_randomized_trash_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in the trash if not given a location ."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_trash.wells()).then_return([mock_well])

    subject.drop_tip()

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=True,
        ),
        times=1,
    )


@pytest.mark.parametrize(
    ["api_version", "alternate_drop"],
    [(APIVersion(2, 17), True), (APIVersion(2, 18), False)],
)
def test_drop_tip_in_trash_bin(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    alternate_drop: bool,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in a deck configured trash bin."""
    trash_bin = decoy.mock(cls=TrashBin)

    subject.drop_tip(trash_bin)

    decoy.verify(
        mock_instrument_core.drop_tip_in_disposal_location(
            trash_bin,
            home_after=None,
            alternate_tip_drop=alternate_drop,
        ),
        times=1,
    )


@pytest.mark.parametrize(
    ["api_version", "alternate_drop"],
    [(APIVersion(2, 17), True), (APIVersion(2, 18), False)],
)
def test_drop_tip_in_waste_chute(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    alternate_drop: bool,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in a deck configured trash bin or waste chute."""
    waste_chute = decoy.mock(cls=WasteChute)

    subject.drop_tip(waste_chute)

    decoy.verify(
        mock_instrument_core.drop_tip_in_disposal_location(
            waste_chute,
            home_after=None,
            alternate_tip_drop=alternate_drop,
        ),
        times=1,
    )


def test_drop_tip_in_disposal_location_implicitly(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in a deck configured trash bin when no arguments have been provided."""
    trash_bin = decoy.mock(cls=TrashBin)
    subject.trash_container = trash_bin

    subject.drop_tip()

    decoy.verify(
        mock_instrument_core.drop_tip_in_disposal_location(
            trash_bin,
            home_after=None,
            alternate_tip_drop=True,
        ),
        times=1,
    )


def test_return_tip(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a tip and return it."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_well)
    subject.return_tip()

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=False,
        ),
    )

    with pytest.raises(TypeError, match="Last tip location"):
        subject.return_tip()


def test_dispense_with_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a given location."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(PointTarget(location=input_location, in_place=True))
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)

    subject.dispense(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=None,
            in_place=True,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
            push_out=None,
        ),
        times=1,
    )


def test_dispense_with_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a well location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(3.0)

    subject.dispense(volume=42.0, location=input_location, rate=1.23, push_out=7)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=3.0,
            push_out=7,
        ),
        times=1,
    )


def test_dispense_with_well(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a well."""
    mock_well = decoy.mock(cls=Well)
    bottom_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.bottom(z=1.0)).then_return(bottom_location)
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)

    subject.dispense(volume=42.0, location=input_location, rate=1.23, push_out=None)

    decoy.verify(
        mock_instrument_core.dispense(
            location=bottom_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
            push_out=None,
        ),
        times=1,
    )


def test_dispense_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Should raise a RuntimeError."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.dispense(location=None)


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_dispense_push_out_on_not_allowed_version(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Should raise a APIVersionError."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(APIVersionError):
        subject.dispense(push_out=3)


def test_touch_tip(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
) -> None:
    """It should touch the pipette tip to the edges of the well with the core."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_instrument_core.has_tip()).then_return(True)

    decoy.when(mock_well.top(z=4.56)).then_return(
        Location(point=Point(1, 2, 3), labware=mock_well)
    )

    decoy.when(mock_well.parent.quirks).then_return([])

    subject.touch_tip(mock_well, radius=0.123, v_offset=4.56, speed=42.0)

    decoy.verify(
        mock_instrument_core.touch_tip(
            location=Location(point=Point(1, 2, 3), labware=mock_well),
            well_core=mock_well._core,
            radius=0.123,
            z_offset=4.56,
            speed=42.0,
        )
    )


def test_return_height(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should get the tip return scale factor."""
    decoy.when(mock_instrument_core.get_return_height()).then_return(0.123)

    result = subject.return_height

    assert result == 0.123


def test_flow_rate(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should return a FlowRates object."""
    flow_rates = decoy.mock(cls=FlowRates)
    decoy.when(mock_instrument_core.get_flow_rate()).then_return(flow_rates)

    result = subject.flow_rate

    assert result == flow_rates


@pytest.mark.parametrize("api_version", [APIVersion(2, 13)])
@pytest.mark.parametrize(
    "mock_instrument_core",
    [lazy_fixture("mock_legacy_instrument_core")],
)
def test_plunger_speed(
    decoy: Decoy,
    mock_legacy_instrument_core: LegacyInstrumentCore,
    subject: InstrumentContext,
) -> None:
    """It should return a PlungerSpeeds object on PAPI <= v2.13."""
    plunger_speeds = decoy.mock(cls=PlungerSpeeds)
    decoy.when(mock_legacy_instrument_core.get_speed()).then_return(plunger_speeds)

    result = subject.speed

    assert result == plunger_speeds


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_plunger_speed_removed(subject: InstrumentContext) -> None:
    """It should raise an error on PAPI >= v2.14."""
    with pytest.raises(APIVersionError):
        subject.speed


def test_prepare_to_aspirate(
    subject: InstrumentContext, decoy: Decoy, mock_instrument_core: InstrumentCore
) -> None:
    """It should call the core function."""
    decoy.when(mock_instrument_core.get_current_volume()).then_return(0)
    subject.prepare_to_aspirate()
    decoy.verify(mock_instrument_core.prepare_to_aspirate(), times=1)


def test_prepare_to_aspirate_checks_volume(
    subject: InstrumentContext, decoy: Decoy, mock_instrument_core: InstrumentCore
) -> None:
    """It should raise an error if you prepare for aspirate with liquid in the pipette."""
    decoy.when(mock_instrument_core.get_current_volume()).then_return(10)
    with pytest.raises(CommandPreconditionViolated):
        subject.prepare_to_aspirate()


@pytest.mark.parametrize(
    argnames=["style", "primary_nozzle", "front_right_nozzle", "exception"],
    argvalues=[
        [NozzleLayout.COLUMN, "A1", "H1", does_not_raise()],
        [NozzleLayout.SINGLE, None, None, pytest.raises(ValueError)],
        [NozzleLayout.ROW, "E1", None, pytest.raises(ValueError)],
    ],
)
def test_configure_nozzle_layout(
    subject: InstrumentContext,
    style: NozzleLayout,
    primary_nozzle: Optional[str],
    front_right_nozzle: Optional[str],
    exception: ContextManager[None],
) -> None:
    """The correct model is passed to the engine client."""
    with exception:
        subject.configure_nozzle_layout(style, primary_nozzle, front_right_nozzle)


@pytest.mark.parametrize("api_version", [APIVersion(2, 15)])
def test_dispense_0_volume_means_dispense_everything(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense all liquid to a well."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    decoy.when(
        mock_validation.validate_location(location=input_location, last_location=None)
    ).then_return(mock_validation.PointTarget(location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_current_volume()).then_return(100)
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)
    subject.dispense(volume=0, location=input_location, rate=1.23, push_out=None)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=None,
            in_place=False,
            volume=100,
            rate=1.23,
            flow_rate=5.67,
            push_out=None,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 16)])
def test_dispense_0_volume_means_dispense_nothing(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense no liquid to a well."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    decoy.when(
        mock_validation.validate_location(location=input_location, last_location=None)
    ).then_return(mock_validation.PointTarget(location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)
    subject.dispense(volume=0, location=input_location, rate=1.23, push_out=None)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=None,
            in_place=False,
            volume=0,
            rate=1.23,
            flow_rate=5.67,
            push_out=None,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 15)])
def test_aspirate_0_volume_means_aspirate_everything(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )

    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)
    decoy.when(mock_instrument_core.get_available_volume()).then_return(200)
    subject.aspirate(volume=0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=200,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 16)])
def test_aspirate_0_volume_means_aspirate_nothing(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )

    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )
