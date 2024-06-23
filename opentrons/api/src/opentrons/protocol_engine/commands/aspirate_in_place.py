"""Aspirate in place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.hardware_control import HardwareControlAPI

from .pipetting_common import (
    PipetteIdMixin,
    AspirateVolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from ..errors.exceptions import PipetteNotReadyToAspirateError

if TYPE_CHECKING:
    from ..execution import PipettingHandler
    from ..state import StateView
    from ..notes import CommandNoteAdder

AspirateInPlaceCommandType = Literal["aspirateInPlace"]


class AspirateInPlaceParams(PipetteIdMixin, AspirateVolumeMixin, FlowRateMixin):
    """Payload required to aspirate in place."""

    pass


class AspirateInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateInPlace command."""

    pass


class AspirateInPlaceImplementation(
    AbstractCommandImpl[AspirateInPlaceParams, SuccessData[AspirateInPlaceResult, None]]
):
    """AspirateInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        command_note_adder: CommandNoteAdder,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._command_note_adder = command_note_adder

    async def execute(
        self, params: AspirateInPlaceParams
    ) -> SuccessData[AspirateInPlaceResult, None]:
        """Aspirate without moving the pipette.

        Raises:
            TipNotAttachedError: if no tip is attached to the pipette.
            PipetteNotReadyToAspirateError: pipette plunger is not ready.
        """
        ready_to_aspirate = self._pipetting.get_is_ready_to_aspirate(
            pipette_id=params.pipetteId,
        )

        if not ready_to_aspirate:
            raise PipetteNotReadyToAspirateError(
                "Pipette cannot aspirate in place because of a previous blow out."
                " The first aspirate following a blow-out must be from a specific well"
                " so the plunger can be reset in a known safe position."
            )
        volume = await self._pipetting.aspirate_in_place(
            pipette_id=params.pipetteId,
            volume=params.volume,
            flow_rate=params.flowRate,
            command_note_adder=self._command_note_adder,
        )

        return SuccessData(public=AspirateInPlaceResult(volume=volume), private=None)


class AspirateInPlace(
    BaseCommand[AspirateInPlaceParams, AspirateInPlaceResult, ErrorOccurrence]
):
    """AspirateInPlace command model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams
    result: Optional[AspirateInPlaceResult]

    _ImplementationCls: Type[
        AspirateInPlaceImplementation
    ] = AspirateInPlaceImplementation


class AspirateInPlaceCreate(BaseCommandCreate[AspirateInPlaceParams]):
    """AspirateInPlace command request model."""

    commandType: AspirateInPlaceCommandType = "aspirateInPlace"
    params: AspirateInPlaceParams

    _CommandCls: Type[AspirateInPlace] = AspirateInPlace
