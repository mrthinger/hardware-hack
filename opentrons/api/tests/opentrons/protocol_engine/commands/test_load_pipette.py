"""Test load pipette commands."""
import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.robot.dev_types import RobotType
from opentrons.types import MountType, Point

from opentrons.protocol_engine.errors import InvalidSpecificationForRobotTypeError
from opentrons.protocol_engine.types import FlowRates
from opentrons.protocol_engine.execution import LoadedPipetteData, EquipmentHandler
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.load_pipette import (
    LoadPipetteParams,
    LoadPipetteResult,
    LoadPipettePrivateResult,
    LoadPipetteImplementation,
)
from ..pipette_fixtures import get_default_nozzle_map


async def test_load_pipette_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadPipette command should have an execution implementation."""
    subject = LoadPipetteImplementation(equipment=equipment, state_view=state_view)
    config_data = LoadedStaticPipetteData(
        model="some-model",
        display_name="Hello",
        min_volume=0,
        max_volume=251,
        channels=8,
        home_position=123.1,
        nozzle_offset_z=331.0,
        flow_rates=FlowRates(
            default_aspirate={}, default_dispense={}, default_blow_out={}
        ),
        tip_configuration_lookup_table={},
        nominal_tip_overlap={},
        nozzle_map=get_default_nozzle_map(PipetteNameType.P300_MULTI),
        back_left_corner_offset=Point(x=1, y=2, z=3),
        front_right_corner_offset=Point(x=4, y=5, z=6),
    )
    data = LoadPipetteParams(
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
        pipetteId="some id",
    )

    decoy.when(
        await equipment.load_pipette(
            pipette_name=PipetteNameType.P300_SINGLE,
            mount=MountType.LEFT,
            pipette_id="some id",
        )
    ).then_return(
        LoadedPipetteData(
            pipette_id="some id",
            serial_number="some-serial-number",
            static_config=config_data,
        )
    )

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LoadPipetteResult(pipetteId="some id"),
        private=LoadPipettePrivateResult(
            pipette_id="some id", serial_number="some-serial-number", config=config_data
        ),
    )


async def test_load_pipette_implementation_96_channel(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A LoadPipette command should have an execution implementation."""
    subject = LoadPipetteImplementation(equipment=equipment, state_view=state_view)

    data = LoadPipetteParams(
        pipetteName=PipetteNameType.P1000_96,
        mount=MountType.LEFT,
        pipetteId="some id",
    )
    config_data = LoadedStaticPipetteData(
        model="p1000_96_v3.3",
        display_name="Hello",
        min_volume=0,
        max_volume=251,
        channels=96,
        home_position=123.1,
        nozzle_offset_z=331.0,
        flow_rates=FlowRates(
            default_aspirate={}, default_dispense={}, default_blow_out={}
        ),
        tip_configuration_lookup_table={},
        nominal_tip_overlap={},
        nozzle_map=get_default_nozzle_map(PipetteNameType.P1000_96),
        back_left_corner_offset=Point(x=1, y=2, z=3),
        front_right_corner_offset=Point(x=4, y=5, z=6),
    )

    decoy.when(
        await equipment.load_pipette(
            pipette_name=PipetteNameType.P1000_96,
            mount=MountType.LEFT,
            pipette_id="some id",
        )
    ).then_return(
        LoadedPipetteData(
            pipette_id="pipette-id", serial_number="some id", static_config=config_data
        )
    )

    result = await subject.execute(data)

    assert result == SuccessData(
        public=LoadPipetteResult(pipetteId="pipette-id"),
        private=LoadPipettePrivateResult(
            pipette_id="pipette-id", serial_number="some id", config=config_data
        ),
    )


@pytest.mark.parametrize(
    argnames=["pipette_type", "robot_type"],
    argvalues=[
        (PipetteNameType.P300_SINGLE, "OT-3 Standard"),
        (PipetteNameType.P20_MULTI_GEN2, "OT-3 Standard"),
        (PipetteNameType.P10_MULTI, "OT-3 Standard"),
        (PipetteNameType.P1000_SINGLE, "OT-3 Standard"),
        (PipetteNameType.P1000_MULTI_FLEX, "OT-2 Standard"),
        (PipetteNameType.P50_SINGLE_FLEX, "OT-2 Standard"),
        (PipetteNameType.P1000_96, "OT-2 Standard"),
    ],
)
async def test_loading_wrong_pipette_for_robot_raises_error(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    pipette_type: PipetteNameType,
    robot_type: RobotType,
) -> None:
    """A LoadPipette command should raise error when pipette is not supported on robot."""
    subject = LoadPipetteImplementation(equipment=equipment, state_view=state_view)
    p1000_params = LoadPipetteParams(
        pipetteName=pipette_type,
        mount=MountType.LEFT,
        pipetteId="p1000-id",
    )
    decoy.when(state_view.config.robot_type).then_return(robot_type)
    with pytest.raises(InvalidSpecificationForRobotTypeError):
        await subject.execute(p1000_params)
