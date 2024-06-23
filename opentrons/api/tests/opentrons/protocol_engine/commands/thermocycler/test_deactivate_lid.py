"""Test Thermocycler deactivate lid command implementation."""
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
from opentrons.protocol_engine.commands.thermocycler.deactivate_lid import (
    DeactivateLidImpl,
)


async def test_deactivate_lid(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to deactivate the specified module's lid."""
    subject = DeactivateLidImpl(state_view=state_view, equipment=equipment)

    data = tc_commands.DeactivateLidParams(moduleId="input-thermocycler-id")
    expected_module_id = ThermocyclerModuleId("thermocycler-id")
    expected_result = tc_commands.DeactivateLidResult()

    tc_module_substate = decoy.mock(cls=ThermocyclerModuleSubState)
    tc_hardware = decoy.mock(cls=Thermocycler)

    decoy.when(
        state_view.modules.get_thermocycler_module_substate("input-thermocycler-id")
    ).then_return(tc_module_substate)

    decoy.when(tc_module_substate.module_id).then_return(expected_module_id)

    # Get attached hardware modules
    decoy.when(equipment.get_module_hardware_api(expected_module_id)).then_return(
        tc_hardware
    )

    result = await subject.execute(data)

    decoy.verify(await tc_hardware.deactivate_lid(), times=1)
    assert result == SuccessData(public=expected_result, private=None)
