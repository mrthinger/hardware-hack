from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (
    GCodeFunctionalityDefBase,
)


class OpenLidGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Opening thermocycler lid"
