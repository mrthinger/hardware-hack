"""Pipette config data providers."""
from dataclasses import dataclass
from typing import Dict, Optional

from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    load_data as load_pipette_data,
    types as pip_types,
    pipette_definition,
)

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.nozzle_manager import (
    NozzleConfigurationManager,
    NozzleMap,
)
from opentrons_shared_data.errors.exceptions import MissingConfigurationData

from ..types import FlowRates
from ...types import Point


@dataclass(frozen=True)
class LoadedStaticPipetteData:
    """Static pipette config data for load pipette."""

    model: str
    display_name: str
    min_volume: float
    max_volume: float
    channels: int
    home_position: float
    nozzle_offset_z: float
    flow_rates: FlowRates
    tip_configuration_lookup_table: Dict[
        float, pipette_definition.SupportedTipsDefinition
    ]
    nominal_tip_overlap: Dict[str, float]
    nozzle_map: NozzleMap
    back_left_corner_offset: Point
    front_right_corner_offset: Point


class VirtualPipetteDataProvider:
    """Provide pipette data without requiring hardware control."""

    def __init__(self) -> None:
        """Build a VirtualPipetteDataProvider."""
        self._liquid_class_by_id: Dict[str, pip_types.LiquidClasses] = {}
        self._nozzle_manager_layout_by_id: Dict[str, NozzleConfigurationManager] = {}

    def configure_virtual_pipette_nozzle_layout(
        self,
        pipette_id: str,
        pipette_model_string: str,
        back_left_nozzle: Optional[str] = None,
        front_right_nozzle: Optional[str] = None,
        starting_nozzle: Optional[str] = None,
    ) -> None:
        """Emulate update_nozzle_configuration_for_mount."""
        if pipette_id not in self._nozzle_manager_layout_by_id:
            config = self._get_virtual_pipette_full_config_by_model_string(
                pipette_model_string
            )

            valid_nozzle_maps = load_pipette_data.load_valid_nozzle_maps(
                config.pipette_type,
                config.channels,
                config.version,
            )
            new_nozzle_manager = NozzleConfigurationManager.build_from_config(
                config, valid_nozzle_maps
            )
            if back_left_nozzle and front_right_nozzle:
                new_nozzle_manager.update_nozzle_configuration(
                    back_left_nozzle, front_right_nozzle, starting_nozzle
                )
            self._nozzle_manager_layout_by_id[pipette_id] = new_nozzle_manager
        elif back_left_nozzle and front_right_nozzle:
            # Need to make sure that we pass all the right nozzles here.
            self._nozzle_manager_layout_by_id[pipette_id].update_nozzle_configuration(
                back_left_nozzle, front_right_nozzle, starting_nozzle
            )
        else:
            self._nozzle_manager_layout_by_id[
                pipette_id
            ].reset_to_default_configuration()

    def configure_virtual_pipette_for_volume(
        self, pipette_id: str, volume: float, pipette_model_string: str
    ) -> None:
        """Emulate configure_for_volume with the same logic for changing modes."""
        if pipette_id not in self._liquid_class_by_id:
            self._liquid_class_by_id[pipette_id] = pip_types.LiquidClasses.default
        pipette_model = pipette_load_name.convert_pipette_model(
            PipetteModel(pipette_model_string)
        )
        config = load_pipette_data.load_definition(
            pipette_model.pipette_type,
            pipette_model.pipette_channels,
            pipette_model.pipette_version,
        )

        liquid_class = pipette_definition.liquid_class_for_volume_between_default_and_defaultlowvolume(
            volume, self._liquid_class_by_id[pipette_id], config.liquid_properties
        )
        self._liquid_class_by_id[pipette_id] = liquid_class

    def get_nozzle_layout_for_pipette(self, pipette_id: str) -> NozzleMap:
        """Get the current nozzle layout stored for a virtual pipette."""
        return self._nozzle_manager_layout_by_id[pipette_id].current_configuration

    def get_virtual_pipette_static_config_by_model_string(
        self, pipette_model_string: str, pipette_id: str
    ) -> LoadedStaticPipetteData:
        """Get the config of a pipette when you know its model string (e.g. from state)."""
        pipette_model = pipette_load_name.convert_pipette_model(
            PipetteModel(pipette_model_string)
        )
        return self._get_virtual_pipette_static_config_by_model(
            pipette_model, pipette_id
        )

    def _get_virtual_pipette_full_config_by_model_string(
        self, pipette_model_string: str
    ) -> pipette_definition.PipetteConfigurations:
        """Get the full pipette config from a model string."""
        pipette_model = pipette_load_name.convert_pipette_model(
            PipetteModel(pipette_model_string)
        )
        return load_pipette_data.load_definition(
            pipette_model.pipette_type,
            pipette_model.pipette_channels,
            pipette_model.pipette_version,
        )

    def _get_virtual_pipette_static_config_by_model(  # noqa: C901
        self, pipette_model: pipette_definition.PipetteModelVersionType, pipette_id: str
    ) -> LoadedStaticPipetteData:
        if pipette_id not in self._liquid_class_by_id:
            self._liquid_class_by_id[pipette_id] = pip_types.LiquidClasses.default

        liquid_class = self._liquid_class_by_id[pipette_id]
        config = load_pipette_data.load_definition(
            pipette_model.pipette_type,
            pipette_model.pipette_channels,
            pipette_model.pipette_version,
        )
        try:
            tip_type = pip_types.PipetteTipType(
                config.liquid_properties[liquid_class].max_volume
            )
        except ValueError:
            tip_type = pipette_definition.default_tip_for_liquid_class(
                config.liquid_properties[liquid_class]
            )
        tip_configuration = config.liquid_properties[liquid_class].supported_tips[
            tip_type
        ]
        valid_nozzle_maps = load_pipette_data.load_valid_nozzle_maps(
            pipette_model.pipette_type,
            pipette_model.pipette_channels,
            pipette_model.pipette_version,
        )
        nozzle_manager = NozzleConfigurationManager.build_from_config(
            config, valid_nozzle_maps
        )

        tip_overlap_dict_for_tip_type = None
        for configuration in (
            config.pick_up_tip_configurations.press_fit,
            config.pick_up_tip_configurations.cam_action,
        ):
            if not config:
                continue

            approved_map = None
            for map_key in valid_nozzle_maps.maps.keys():
                if valid_nozzle_maps.maps[map_key] == list(
                    nozzle_manager.current_configuration.map_store.keys()
                ):
                    approved_map = map_key
            if approved_map is None:
                raise MissingConfigurationData(
                    message="Virtual Static Nozzle Configuration does not match any approved map layout for the current pipette."
                )

            if configuration is not None:
                try:
                    tip_overlap_dict_for_tip_type = (
                        configuration.configuration_by_nozzle_map[
                            nozzle_manager.current_configuration.valid_map_key
                        ][tip_type.name].versioned_tip_overlap_dictionary["v0"]
                    )
                    break
                except KeyError:
                    try:
                        default = configuration.configuration_by_nozzle_map[
                            nozzle_manager.current_configuration.valid_map_key
                        ].get("default")
                        if default is not None:
                            tip_overlap_dict_for_tip_type = (
                                default.versioned_tip_overlap_dictionary["v0"]
                            )
                            break
                    except KeyError:
                        tip_overlap_dict_for_tip_type = None
        if tip_overlap_dict_for_tip_type is None:
            raise ValueError(
                "Virtual Static Nozzle Configuration does not have a valid pick up tip configuration."
            )

        pip_back_left = config.pipette_bounding_box_offsets.back_left_corner
        pip_front_right = config.pipette_bounding_box_offsets.front_right_corner
        return LoadedStaticPipetteData(
            model=str(pipette_model),
            display_name=config.display_name,
            min_volume=config.liquid_properties[liquid_class].min_volume,
            max_volume=config.liquid_properties[liquid_class].max_volume,
            channels=config.channels,
            home_position=config.mount_configurations.homePosition,
            nozzle_offset_z=config.nozzle_offset[2],
            tip_configuration_lookup_table={
                k.value: v
                for k, v in config.liquid_properties[
                    liquid_class
                ].supported_tips.items()
            },
            flow_rates=FlowRates(
                default_blow_out=tip_configuration.default_blowout_flowrate.values_by_api_level,
                default_aspirate=tip_configuration.default_aspirate_flowrate.values_by_api_level,
                default_dispense=tip_configuration.default_dispense_flowrate.values_by_api_level,
            ),
            nominal_tip_overlap=tip_overlap_dict_for_tip_type,
            nozzle_map=nozzle_manager.current_configuration,
            back_left_corner_offset=Point(
                pip_back_left[0], pip_back_left[1], pip_back_left[2]
            ),
            front_right_corner_offset=Point(
                pip_front_right[0], pip_front_right[1], pip_front_right[2]
            ),
        )

    def get_virtual_pipette_static_config(
        self, pipette_name: PipetteName, pipette_id: str
    ) -> LoadedStaticPipetteData:
        """Get the config for a virtual pipette, given only the pipette name."""
        pipette_model = pipette_load_name.convert_pipette_name(pipette_name)
        return self._get_virtual_pipette_static_config_by_model(
            pipette_model, pipette_id
        )


def get_pipette_static_config(pipette_dict: PipetteDict) -> LoadedStaticPipetteData:
    """Get the config for a pipette, given the state/config object from the HW API."""
    back_left_offset = pipette_dict["pipette_bounding_box_offsets"].back_left_corner
    front_right_offset = pipette_dict["pipette_bounding_box_offsets"].front_right_corner
    return LoadedStaticPipetteData(
        model=pipette_dict["model"],
        display_name=pipette_dict["display_name"],
        min_volume=pipette_dict["min_volume"],
        max_volume=pipette_dict["max_volume"],
        channels=pipette_dict["channels"],
        flow_rates=FlowRates(
            default_blow_out=pipette_dict["default_blow_out_flow_rates"],
            default_aspirate=pipette_dict["default_aspirate_flow_rates"],
            default_dispense=pipette_dict["default_dispense_flow_rates"],
        ),
        tip_configuration_lookup_table={
            k.value: v for k, v in pipette_dict["supported_tips"].items()
        },
        nominal_tip_overlap=pipette_dict["tip_overlap"],
        # TODO(mc, 2023-02-28): these two values are not present in PipetteDict
        # https://opentrons.atlassian.net/browse/RCORE-655
        home_position=0,
        nozzle_offset_z=0,
        nozzle_map=pipette_dict["current_nozzle_map"],
        back_left_corner_offset=Point(
            back_left_offset[0], back_left_offset[1], back_left_offset[2]
        ),
        front_right_corner_offset=Point(
            front_right_offset[0], front_right_offset[1], front_right_offset[2]
        ),
    )
