"""Test pause command."""
from decoy import Decoy

from opentrons.protocol_engine.execution import RunControlHandler

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.wait_for_duration import (
    WaitForDurationParams,
    WaitForDurationResult,
    WaitForDurationImplementation,
)


async def test_pause_implementation(
    decoy: Decoy,
    run_control: RunControlHandler,
) -> None:
    """It should await the duration using the RunControlHandler."""
    subject = WaitForDurationImplementation(run_control=run_control)

    data = WaitForDurationParams(message="hello world", seconds=42.0)

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForDurationResult(), private=None)
    decoy.verify(await run_control.wait_for_duration(42.0), times=1)
