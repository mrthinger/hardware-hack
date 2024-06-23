"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from pydantic import Field

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    DispenseVolumeMixin,
    FlowRateMixin,
    WellLocationMixin,
    BaseLiquidHandlingResult,
    DestinationPositionResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler


DispenseCommandType = Literal["dispense"]


class DispenseParams(
    PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin, WellLocationMixin
):
    """Payload required to dispense to a specific well."""

    pushOut: Optional[float] = Field(
        None,
        description="push the plunger a small amount farther than necessary for accurate low-volume dispensing",
    )


class DispenseResult(BaseLiquidHandlingResult, DestinationPositionResult):
    """Result data from the execution of a Dispense command."""

    pass


class DispenseImplementation(
    AbstractCommandImpl[DispenseParams, SuccessData[DispenseResult, None]]
):
    """Dispense command implementation."""

    def __init__(
        self, movement: MovementHandler, pipetting: PipettingHandler, **kwargs: object
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting

    async def execute(
        self, params: DispenseParams
    ) -> SuccessData[DispenseResult, None]:
        """Move to and dispense to the requested well."""
        position = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )
        volume = await self._pipetting.dispense_in_place(
            pipette_id=params.pipetteId,
            volume=params.volume,
            flow_rate=params.flowRate,
            push_out=params.pushOut,
        )

        return SuccessData(
            public=DispenseResult(
                volume=volume,
                position=DeckPoint(x=position.x, y=position.y, z=position.z),
            ),
            private=None,
        )


class Dispense(BaseCommand[DispenseParams, DispenseResult, ErrorOccurrence]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams
    result: Optional[DispenseResult]

    _ImplementationCls: Type[DispenseImplementation] = DispenseImplementation


class DispenseCreate(BaseCommandCreate[DispenseParams]):
    """Create dispense command request model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams

    _CommandCls: Type[Dispense] = Dispense
