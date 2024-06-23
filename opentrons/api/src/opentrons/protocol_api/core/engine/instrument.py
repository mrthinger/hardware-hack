"""ProtocolEngine-based InstrumentContext core implementation."""
from __future__ import annotations

from typing import Optional, TYPE_CHECKING, cast, Union
from opentrons.protocols.api_support.types import APIVersion

from opentrons.types import Location, Mount
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import FlowRates, find_value_for_api_version
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine import (
    DeckPoint,
    DropTipWellLocation,
    DropTipWellOrigin,
    WellLocation,
    WellOrigin,
    WellOffset,
    AllNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
    RowNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
)
from opentrons.protocol_engine.types import (
    PRIMARY_NOZZLE_LITERAL,
    NozzleLayoutConfigurationType,
    AddressableOffsetVector,
)
from opentrons.protocol_engine.errors.exceptions import TipNotAttachedError
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
from opentrons.hardware_control.nozzle_manager import NozzleMap
from . import deck_conflict

from ..instrument import AbstractInstrument
from .well import WellCore

from ...disposal_locations import TrashBin, WasteChute

if TYPE_CHECKING:
    from .protocol import ProtocolCore


_DISPENSE_VOLUME_VALIDATION_ADDED_IN = APIVersion(2, 17)


class InstrumentCore(AbstractInstrument[WellCore]):
    """Instrument API core using a ProtocolEngine.

    Args:
        pipette_id: ProtocolEngine ID of the loaded instrument.
    """

    def __init__(
        self,
        pipette_id: str,
        engine_client: EngineClient,
        sync_hardware_api: SyncHardwareAPI,
        protocol_core: ProtocolCore,
        default_movement_speed: float,
    ) -> None:
        self._pipette_id = pipette_id
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api
        self._protocol_core = protocol_core

        # TODO(jbl 2022-11-03) flow_rates should not live in the cores, and should be moved to the protocol context
        #   along with other rate related refactors (for the hardware API)
        flow_rates = self._engine_client.state.pipettes.get_flow_rates(pipette_id)
        self._aspirate_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_aspirate
        )
        self._dispense_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_dispense
        )
        self._blow_out_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_blow_out
        )
        self._flow_rates = FlowRates(self)

        self.set_default_speed(speed=default_movement_speed)

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        speed = self._engine_client.state.pipettes.get_movement_speed(
            pipette_id=self._pipette_id
        )
        assert speed is not None, "Pipette loading should have set a default speed."
        return speed

    def set_default_speed(self, speed: float) -> None:
        self._engine_client.set_pipette_movement_speed(
            pipette_id=self._pipette_id, speed=speed
        )

    def aspirate(
        self,
        location: Location,
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
    ) -> None:
        """Aspirate a given volume of liquid from the specified location.
        Args:
            volume: The volume of liquid to aspirate, in microliters.
            location: The exact location to aspirate from.
            well_core: The well to aspirate from, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to aspirate at.
            in_place: whether this is a in-place command.
        """
        if well_core is None:
            if not in_place:
                self._engine_client.execute_command(
                    cmd.MoveToCoordinatesParams(
                        pipetteId=self._pipette_id,
                        coordinates=DeckPoint(
                            x=location.point.x, y=location.point.y, z=location.point.z
                        ),
                        minimumZHeight=None,
                        forceDirect=False,
                        speed=None,
                    )
                )

            self._engine_client.execute_command(
                cmd.AspirateInPlaceParams(
                    pipetteId=self._pipette_id, volume=volume, flowRate=flow_rate
                )
            )

        else:
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )
            deck_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.AspirateParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    volume=volume,
                    flowRate=flow_rate,
                )
            )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def dispense(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
        push_out: Optional[float],
    ) -> None:
        """Dispense a given volume of liquid into the specified location.
        Args:
            volume: The volume of liquid to dispense, in microliters.
            location: The exact location to dispense to.
            well_core: The well to dispense to, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to dispense at.
            in_place: whether this is a in-place command.
            push_out: The amount to push the plunger below bottom position.
        """
        if self._protocol_core.api_version < _DISPENSE_VOLUME_VALIDATION_ADDED_IN:
            # In older API versions, when you try to dispense more than you can,
            # it gets clamped.
            volume = min(volume, self.get_current_volume())
        else:
            # Newer API versions raise an error if you try to dispense more than
            # you can. Let the error come from Protocol Engine's validation.
            pass

        if well_core is None:
            if not in_place:
                if isinstance(location, (TrashBin, WasteChute)):
                    self._move_to_disposal_location(
                        disposal_location=location, force_direct=False, speed=None
                    )
                else:
                    self._engine_client.execute_command(
                        cmd.MoveToCoordinatesParams(
                            pipetteId=self._pipette_id,
                            coordinates=DeckPoint(
                                x=location.point.x,
                                y=location.point.y,
                                z=location.point.z,
                            ),
                            minimumZHeight=None,
                            forceDirect=False,
                            speed=None,
                        )
                    )

            self._engine_client.execute_command(
                cmd.DispenseInPlaceParams(
                    pipetteId=self._pipette_id,
                    volume=volume,
                    flowRate=flow_rate,
                    pushOut=push_out,
                )
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )
            deck_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.DispenseParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    volume=volume,
                    flowRate=flow_rate,
                    pushOut=push_out,
                )
            )

        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def blow_out(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        in_place: bool,
    ) -> None:
        """Blow liquid out of the tip.

        Args:
            location: The location to blow out into.
            well_core: The well to blow out into.
            in_place: whether this is a in-place command.
        """
        flow_rate = self.get_blow_out_flow_rate(1.0)
        if well_core is None:
            if not in_place:
                if isinstance(location, (TrashBin, WasteChute)):
                    self._move_to_disposal_location(
                        disposal_location=location, force_direct=False, speed=None
                    )
                else:
                    self._engine_client.execute_command(
                        cmd.MoveToCoordinatesParams(
                            pipetteId=self._pipette_id,
                            coordinates=DeckPoint(
                                x=location.point.x,
                                y=location.point.y,
                                z=location.point.z,
                            ),
                            forceDirect=False,
                            minimumZHeight=None,
                            speed=None,
                        )
                    )

            self._engine_client.execute_command(
                cmd.BlowOutInPlaceParams(pipetteId=self._pipette_id, flowRate=flow_rate)
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )
            deck_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.BlowOutParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    # TODO(jbl 2022-11-07) PAPIv2 does not have an argument for rate and
                    #   this also needs to be refactored along with other flow rate related issues
                    flowRate=flow_rate,
                )
            )

        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def touch_tip(
        self,
        location: Location,
        well_core: WellCore,
        radius: float,
        z_offset: float,
        speed: float,
    ) -> None:
        """Touch pipette tip to edges of the well

        Args:
            location: Location moved to, only used for ProtocolCore location cache.
            well_core: The target well for touch tip.
            radius: Percentage modifier for well radius to touch.
            z_offset: Vertical offset for pipette tip during touch tip.
            speed: Speed for the touch tip movements.
        """
        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        # Touch tip is always done from the top of the well.
        well_location = WellLocation(
            origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=z_offset)
        )
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        self._engine_client.execute_command(
            cmd.TouchTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                radius=radius,
                speed=speed,
            )
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def pick_up_tip(
        self,
        location: Location,
        well_core: WellCore,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        """Move to and pick up a tip from a given well.

        Args:
            location: The location of the well we're picking up from.
                Used to calculate the relative well offset for the pick up command.
            well_core: The "well" to pick up from.
            presses: Customize the number of presses the pipette does.
            increment: Customize the movement "distance" of the pipette to press harder.
            prep_after: Not used by this core, pipette preparation will always happen.
        """
        assert (
            presses is None and increment is None
        ), "Tip pick-up with custom presses or increment deprecated"

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = self._engine_client.state.geometry.get_relative_well_location(
            labware_id=labware_id,
            well_name=well_name,
            absolute_point=location.point,
        )
        deck_conflict.check_safe_for_tip_pickup_and_return(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
        )
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        self._engine_client.execute_command(
            cmd.PickUpTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
            )
        )

        # Set the "last location" unconditionally, even if the command failed
        # and was recovered from and we don't know if the pipette is physically here.
        # This isn't used for path planning, but rather for implicit destination
        # selection like in `pipette.aspirate(location=None)`.
        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def drop_tip(
        self,
        location: Optional[Location],
        well_core: WellCore,
        home_after: Optional[bool],
        alternate_drop_location: Optional[bool] = False,
    ) -> None:
        """Move to and drop a tip into a given well.

        Args:
            location: The location of the well we're dropping tip into.
                Used to calculate the relative well offset for the drop command.
            well_core: The well we're dropping into
            home_after: Whether to home the pipette after the tip is dropped.
            alternate_drop_location: Whether to randomize the exact location to drop tip
                within the specified well.
        """
        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        if location is not None:
            relative_well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            well_location = DropTipWellLocation(
                origin=DropTipWellOrigin(relative_well_location.origin.value),
                offset=relative_well_location.offset,
            )
        else:
            well_location = DropTipWellLocation()

        if self._engine_client.state.labware.is_tiprack(labware_id):
            deck_conflict.check_safe_for_tip_pickup_and_return(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
            )
        deck_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        self._engine_client.execute_command(
            cmd.DropTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                homeAfter=home_after,
                alternateDropLocation=alternate_drop_location,
            )
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def drop_tip_in_disposal_location(
        self,
        disposal_location: Union[TrashBin, WasteChute],
        home_after: Optional[bool],
        alternate_tip_drop: bool = False,
    ) -> None:
        self._move_to_disposal_location(
            disposal_location,
            force_direct=False,
            speed=None,
            alternate_tip_drop=alternate_tip_drop,
        )
        self._drop_tip_in_place(home_after=home_after)
        self._protocol_core.set_last_location(location=None, mount=self.get_mount())

    def _move_to_disposal_location(
        self,
        disposal_location: Union[TrashBin, WasteChute],
        force_direct: bool,
        speed: Optional[float],
        alternate_tip_drop: bool = False,
    ) -> None:
        # TODO (nd, 2023-11-30): give appropriate offset when finalized
        # https://opentrons.atlassian.net/browse/RSS-391

        disposal_offset = disposal_location.offset
        offset = AddressableOffsetVector(
            x=disposal_offset.x, y=disposal_offset.y, z=disposal_offset.z
        )

        if isinstance(disposal_location, TrashBin):
            addressable_area_name = disposal_location.area_name
            self._engine_client.execute_command(
                cmd.MoveToAddressableAreaForDropTipParams(
                    pipetteId=self._pipette_id,
                    addressableAreaName=addressable_area_name,
                    offset=offset,
                    forceDirect=force_direct,
                    speed=speed,
                    minimumZHeight=None,
                    alternateDropLocation=alternate_tip_drop,
                    ignoreTipConfiguration=True,
                )
            )

        if isinstance(disposal_location, WasteChute):
            num_channels = self.get_channels()
            addressable_area_name = {
                1: "1ChannelWasteChute",
                8: "8ChannelWasteChute",
                96: "96ChannelWasteChute",
            }[num_channels]

            self._engine_client.execute_command(
                cmd.MoveToAddressableAreaParams(
                    pipetteId=self._pipette_id,
                    addressableAreaName=addressable_area_name,
                    offset=offset,
                    forceDirect=force_direct,
                    speed=speed,
                    minimumZHeight=None,
                )
            )

    def _drop_tip_in_place(self, home_after: Optional[bool]) -> None:
        self._engine_client.execute_command(
            cmd.DropTipInPlaceParams(
                pipetteId=self._pipette_id,
                homeAfter=home_after,
            )
        )

    def home(self) -> None:
        z_axis = self._engine_client.state.pipettes.get_z_axis(self._pipette_id)
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.execute_command(cmd.HomeParams(axes=[z_axis, plunger_axis]))

    def home_plunger(self) -> None:
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.execute_command(cmd.HomeParams(axes=[plunger_axis]))

    def move_to(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        if well_core is not None:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            labware_id = well_core.labware_id
            well_name = well_core.get_name()
            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    minimumZHeight=minimum_z_height,
                    forceDirect=force_direct,
                    speed=speed,
                )
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                self._move_to_disposal_location(
                    disposal_location=location, force_direct=force_direct, speed=speed
                )
            else:
                self._engine_client.execute_command(
                    cmd.MoveToCoordinatesParams(
                        pipetteId=self._pipette_id,
                        coordinates=DeckPoint(
                            x=location.point.x, y=location.point.y, z=location.point.z
                        ),
                        minimumZHeight=minimum_z_height,
                        forceDirect=force_direct,
                        speed=speed,
                    )
                )
        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def get_mount(self) -> Mount:
        """Get the mount the pipette is attached to."""
        return self._engine_client.state.pipettes.get(
            self._pipette_id
        ).mount.to_hw_mount()

    def get_pipette_name(self) -> str:
        """Get the pipette's load name as a string.

        Will match the load name of the actually loaded pipette,
        which may differ from the requested load name.
        """
        # TODO (tz, 11-23-22): revert this change when merging
        # https://opentrons.atlassian.net/browse/RLIQ-251
        pipette = self._engine_client.state.pipettes.get(self._pipette_id)
        return (
            pipette.pipetteName.value
            if isinstance(pipette.pipetteName, PipetteNameType)
            else pipette.pipetteName
        )

    def get_model(self) -> str:
        return self._engine_client.state.pipettes.get_model_name(self._pipette_id)

    def get_display_name(self) -> str:
        return self._engine_client.state.pipettes.get_display_name(self._pipette_id)

    def get_min_volume(self) -> float:
        return self._engine_client.state.pipettes.get_minimum_volume(self._pipette_id)

    def get_max_volume(self) -> float:
        return self._engine_client.state.pipettes.get_maximum_volume(self._pipette_id)

    def get_working_volume(self) -> float:
        return self._engine_client.state.pipettes.get_working_volume(self._pipette_id)

    def get_current_volume(self) -> float:
        try:
            current_volume = self._engine_client.state.pipettes.get_aspirated_volume(
                self._pipette_id
            )
        except TipNotAttachedError:
            current_volume = None

        return current_volume or 0

    def get_available_volume(self) -> float:
        try:
            available_volume = self._engine_client.state.pipettes.get_available_volume(
                self._pipette_id
            )
        except TipNotAttachedError:
            available_volume = None

        return available_volume or 0

    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
        return self._sync_hardware_api.get_attached_instrument(self.get_mount())  # type: ignore[no-any-return]

    def get_channels(self) -> int:
        return self._engine_client.state.tips.get_pipette_channels(self._pipette_id)

    def get_active_channels(self) -> int:
        return self._engine_client.state.tips.get_pipette_active_channels(
            self._pipette_id
        )

    def get_nozzle_map(self) -> NozzleMap:
        return self._engine_client.state.tips.get_pipette_nozzle_map(self._pipette_id)

    def has_tip(self) -> bool:
        return (
            self._engine_client.state.pipettes.get_attached_tip(self._pipette_id)
            is not None
        )

    def get_return_height(self) -> float:
        return self._engine_client.state.pipettes.get_return_tip_scale(self._pipette_id)

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rates

    def get_aspirate_flow_rate(self, rate: float = 1.0) -> float:
        return self._aspirate_flow_rate * rate

    def get_dispense_flow_rate(self, rate: float = 1.0) -> float:
        return self._dispense_flow_rate * rate

    def get_blow_out_flow_rate(self, rate: float = 1.0) -> float:
        return self._blow_out_flow_rate * rate

    def get_nozzle_configuration(self) -> NozzleConfigurationType:
        return self._engine_client.state.pipettes.get_nozzle_layout_type(
            self._pipette_id
        )

    def is_tip_tracking_available(self) -> bool:
        primary_nozzle = self._engine_client.state.pipettes.get_primary_nozzle(
            self._pipette_id
        )
        if self.get_nozzle_configuration() == NozzleConfigurationType.FULL:
            return True
        else:
            if self.get_channels() == 96:
                return True
            if self.get_channels() == 8:
                # TODO: (cb, 03/06/24): Enable automatic tip tracking on the 8 channel pipettes once PAPI support exists
                return (
                    self.get_nozzle_configuration() == NozzleConfigurationType.SINGLE
                    and primary_nozzle == "H1"
                )
        return False

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        if aspirate is not None:
            assert aspirate > 0
            self._aspirate_flow_rate = aspirate
        if dispense is not None:
            assert dispense > 0
            self._dispense_flow_rate = dispense
        if blow_out is not None:
            assert blow_out > 0
            self._blow_out_flow_rate = blow_out

    def configure_for_volume(self, volume: float) -> None:
        self._engine_client.execute_command(
            cmd.ConfigureForVolumeParams(pipetteId=self._pipette_id, volume=volume)
        )

    def prepare_to_aspirate(self) -> None:
        self._engine_client.execute_command(
            cmd.PrepareToAspirateParams(pipetteId=self._pipette_id)
        )

    def configure_nozzle_layout(
        self,
        style: NozzleLayout,
        primary_nozzle: Optional[str],
        front_right_nozzle: Optional[str],
    ) -> None:
        if style == NozzleLayout.COLUMN:
            configuration_model: NozzleLayoutConfigurationType = (
                ColumnNozzleLayoutConfiguration(
                    primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
                )
            )
        elif style == NozzleLayout.ROW:
            configuration_model = RowNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
            )
        elif style == NozzleLayout.QUADRANT:
            assert front_right_nozzle is not None
            configuration_model = QuadrantNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle),
                frontRightNozzle=front_right_nozzle,
            )
        elif style == NozzleLayout.SINGLE:
            configuration_model = SingleNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
            )
        else:
            configuration_model = AllNozzleLayoutConfiguration()
        self._engine_client.execute_command(
            cmd.ConfigureNozzleLayoutParams(
                pipetteId=self._pipette_id, configurationParams=configuration_model
            )
        )

    def retract(self) -> None:
        """Retract this instrument to the top of the gantry."""
        z_axis = self._engine_client.state.pipettes.get_z_axis(self._pipette_id)
        self._engine_client.execute_command(cmd.HomeParams(axes=[z_axis]))
