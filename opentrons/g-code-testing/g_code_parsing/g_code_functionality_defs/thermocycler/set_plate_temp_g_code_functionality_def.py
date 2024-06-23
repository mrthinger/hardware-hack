from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (
    GCodeFunctionalityDefBase,
)


class SetPlateTempGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    PLATE_TEMP_ARG_KEY = "S"

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        temp = g_code_args[cls.PLATE_TEMP_ARG_KEY]
        return f"Setting thermocycler plate temp to {temp}C"
