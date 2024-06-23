import pytest
from typing import Dict, Optional
from unittest import mock
from opentrons import types
from opentrons.hardware_control import ot3api
from opentrons.hardware_control.types import Axis
from opentrons_shared_data.pipette import name_for_model
from opentrons_shared_data.pipette.dev_types import PipetteModel


@pytest.mark.parametrize(
    "pipette_model", ["p1000_single_v3.3", "p1000_single_v3.3", "p50_multi_v3.3"]
)
async def test_transforms_roundtrip(pipette_model: PipetteModel) -> None:
    attached: Dict[types.Mount, Dict[str, Optional[str]]] = {
        types.Mount.LEFT: {
            "model": pipette_model,
            "id": pipette_model + "_idididid_left",
            "name": name_for_model(pipette_model),
        },
        types.Mount.RIGHT: {
            "model": pipette_model,
            "id": pipette_model + "_idididid_right",
            "name": name_for_model(pipette_model),
        },
    }
    sim = await ot3api.OT3API.build_hardware_simulator(attached_instruments=attached)
    target = types.Point(20, 30, 40)
    await sim.move_to(types.Mount.RIGHT, target)
    assert target == await sim.gantry_position(types.Mount.RIGHT)


@pytest.mark.parametrize(
    "pipette_model", ["p1000_single_v3.3", "p50_single_v3.3", "p1000_multi_v3.3"]
)
async def test_transform_values(
    pipette_model: PipetteModel, enable_ot3_hardware_controller: None
) -> None:
    attached: Dict[types.Mount, Dict[str, Optional[str]]] = {
        types.Mount.LEFT: {
            "model": pipette_model,
            "id": pipette_model + "_idididid_left",
            "name": name_for_model(pipette_model),
        },
        types.Mount.RIGHT: {
            "model": pipette_model,
            "id": pipette_model + "_idididid_right",
            "name": name_for_model(pipette_model),
        },
    }
    sim = await ot3api.OT3API.build_hardware_simulator(attached_instruments=attached)
    target = types.Point(20, 30, 40)
    with mock.patch.object(
        sim._backend,
        "move",
        mock.MagicMock(side_effect=sim._backend.move),
        spec=sim._backend.move,
    ) as mock_move:
        await sim.move_to(types.Mount.RIGHT, target)
        right_pipette = sim.hardware_instruments[types.Mount.RIGHT]
        assert right_pipette
        right_offset = right_pipette.critical_point()
        point = [
            (target.x - right_offset[0] - sim.config.right_mount_offset[0]) * -1
            + sim.config.carriage_offset[0],
            (target.y - right_offset[1] - sim.config.right_mount_offset[1]) * -1
            + sim.config.carriage_offset[1],
            (target.z - right_offset[2] - sim.config.right_mount_offset[2]) * -1
            + sim.config.carriage_offset[2],
        ]
        assert mock_move.call_args[0][1][Axis.X] == point[0]
        assert mock_move.call_args[0][1][Axis.Y] == point[1]
        assert mock_move.call_args[0][1][Axis.Z_R] == point[2]

    with mock.patch.object(
        sim._backend,
        "move",
        mock.MagicMock(side_effect=sim._backend.move),
        spec=sim._backend.move,
    ) as mock_move:
        await sim.move_to(types.Mount.LEFT, target)
        left_pipette = sim.hardware_instruments[types.Mount.LEFT]
        assert left_pipette
        left_offset = left_pipette.critical_point()
        point = [
            (target.x - left_offset[0] - sim.config.left_mount_offset[0]) * -1
            + sim.config.carriage_offset[0],
            (target.y - left_offset[1] - sim.config.left_mount_offset[1]) * -1
            + sim.config.carriage_offset[1],
            (target.z - left_offset[2] - sim.config.left_mount_offset[2]) * -1
            + sim.config.carriage_offset[2],
        ]
        assert mock_move.call_args[0][1][Axis.X] == point[0]
        assert mock_move.call_args[0][1][Axis.Y] == point[1]
        assert mock_move.call_args[0][1][Axis.Z_L] == point[2]
