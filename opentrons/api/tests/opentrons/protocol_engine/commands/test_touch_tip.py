"""Test touch tip commands."""
import pytest
from decoy import Decoy

from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint
from opentrons.protocol_engine import WellLocation, WellOffset, DeckPoint, errors
from opentrons.protocol_engine.execution import MovementHandler, GantryMover
from opentrons.protocol_engine.state import StateView
from opentrons.types import Point

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.touch_tip import (
    TouchTipParams,
    TouchTipResult,
    TouchTipImplementation,
)


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


@pytest.fixture
def mock_movement_handler(decoy: Decoy) -> MovementHandler:
    """Get a mock MovementHandler."""
    return decoy.mock(cls=MovementHandler)


@pytest.fixture
def mock_gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mock GantryMover."""
    return decoy.mock(cls=GantryMover)


@pytest.fixture
def subject(
    mock_state_view: StateView,
    mock_movement_handler: MovementHandler,
    mock_gantry_mover: GantryMover,
) -> TouchTipImplementation:
    """Get the test subject."""
    return TouchTipImplementation(
        state_view=mock_state_view,
        movement=mock_movement_handler,
        gantry_mover=mock_gantry_mover,
    )


async def test_touch_tip_implementation(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_movement_handler: MovementHandler,
    mock_gantry_mover: GantryMover,
    subject: TouchTipImplementation,
) -> None:
    """A TouchTip command should have an execution implementation."""
    params = TouchTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        radius=0.456,
        speed=42.0,
    )

    decoy.when(
        await mock_movement_handler.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        mock_state_view.pipettes.get_movement_speed(
            pipette_id="abc", requested_speed=42.0
        )
    ).then_return(9001)

    decoy.when(
        mock_state_view.motion.get_touch_tip_waypoints(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            center_point=Point(x=1, y=2, z=3),
            radius=0.456,
        )
    ).then_return(
        [
            Waypoint(
                position=Point(x=11, y=22, z=33),
                critical_point=CriticalPoint.XY_CENTER,
            ),
            Waypoint(
                position=Point(x=44, y=55, z=66),
                critical_point=CriticalPoint.XY_CENTER,
            ),
        ]
    )

    decoy.when(
        await mock_gantry_mover.move_to(
            pipette_id="abc",
            waypoints=[
                Waypoint(
                    position=Point(x=11, y=22, z=33),
                    critical_point=CriticalPoint.XY_CENTER,
                ),
                Waypoint(
                    position=Point(x=44, y=55, z=66),
                    critical_point=CriticalPoint.XY_CENTER,
                ),
            ],
            speed=9001,
        )
    ).then_return(Point(x=4, y=5, z=6))

    result = await subject.execute(params)

    assert result == SuccessData(
        public=TouchTipResult(position=DeckPoint(x=4, y=5, z=6)), private=None
    )


async def test_touch_tip_disabled(
    decoy: Decoy, mock_state_view: StateView, subject: TouchTipImplementation
) -> None:
    """It should disallow touch tip on labware with the touchTipDisabled quirk."""
    params = TouchTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(),
    )

    decoy.when(
        mock_state_view.labware.get_has_quirk("123", "touchTipDisabled")
    ).then_return(True)

    with pytest.raises(errors.TouchTipDisabledError):
        await subject.execute(params)


async def test_touch_tip_no_tip_racks(
    decoy: Decoy, mock_state_view: StateView, subject: TouchTipImplementation
) -> None:
    """It should disallow touch tip on tip racks."""
    params = TouchTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(),
    )

    decoy.when(mock_state_view.labware.is_tiprack("123")).then_return(True)

    with pytest.raises(errors.LabwareIsTipRackError):
        await subject.execute(params)
