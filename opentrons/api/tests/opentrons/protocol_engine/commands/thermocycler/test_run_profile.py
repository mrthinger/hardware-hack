"""Test Thermocycler run profile command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import Thermocycler

from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    ThermocyclerModuleSubState,
    ThermocyclerModuleId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import thermocycler as tc_commands
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.thermocycler.run_profile import (
    RunProfileImpl,
)


async def test_run_profile(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to execute the specified module's profile run."""
    subject = RunProfileImpl(state_view=state_view, equipment=equipment)

    step_data = [
        tc_commands.RunProfileStepParams(celsius=12.3, holdSeconds=45),
        tc_commands.RunProfileStepParams(celsius=45.6, holdSeconds=78),
    ]
    data = tc_commands.RunProfileParams(
        moduleId="input-thermocycler-id",
        profile=step_data,
        blockMaxVolumeUl=56.7,
    )
    expected_result = tc_commands.RunProfileResult()

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(
        ThermocyclerModuleId("thermocycler-id")
    )

    # Stub temperature validation from hs module view
    decoy.when(tc_module_substate.validate_target_block_temperature(12.3)).then_return(
        32.1
    )
    decoy.when(tc_module_substate.validate_target_block_temperature(45.6)).then_return(
        65.4
    )

    # Stub volume validation from hs module view
    decoy.when(tc_module_substate.validate_max_block_volume(56.7)).then_return(76.5)

    # Get attached hardware modules
    decoy.when(
        equipment.get_module_hardware_api(ThermocyclerModuleId("thermocycler-id"))
    ).then_return(tc_hardware)

    result = await subject.execute(data)

    decoy.verify(
        await tc_hardware.cycle_temperatures(
            steps=[
                {"temperature": 32.1, "hold_time_seconds": 45},
                {"temperature": 65.4, "hold_time_seconds": 78},
            ],
            repetitions=1,
            volume=76.5,
        ),
        times=1,
    )
    assert result == SuccessData(public=expected_result, private=None)
