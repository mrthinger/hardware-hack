from typing import Dict, Any
from typing_extensions import Protocol

from .types import ConfigType
from opentrons.hardware_control.types import HardwareFeatureFlags


class Configurable(Protocol[ConfigType]):
    """Protocol specifying hardware control configuration."""

    def get_config(self) -> ConfigType:
        """Get the robot's configuration object.

        :returns .RobotConfig: The object.
        """
        ...

    def set_config(self, config: ConfigType) -> None:
        """Replace the currently-loaded config"""
        ...

    @property
    def hardware_feature_flags(self) -> HardwareFeatureFlags:
        ...

    @hardware_feature_flags.setter
    def hardware_feature_flags(self, feature_flags: HardwareFeatureFlags) -> None:
        """Replace the currently-configured hardware feature flags."""
        ...

    @property
    def config(self) -> ConfigType:
        ...

    @config.setter
    def config(self, config: ConfigType) -> None:
        ...

    async def update_config(self, **kwargs: Dict[str, Any]) -> None:
        """Update values of the robot's configuration.

        `kwargs` should contain keys of the robot's configuration. For
        instance, `update_config(log_level='debug)` would change the API
        server log level to logging.DEBUG.

        Documentation on keys can be found in the documentation for RobotConfig.
        """
        ...
