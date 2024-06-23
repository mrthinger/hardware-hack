import re
from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (
    GCodeFunctionalityDefBase,
)


class GetLidTempGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    RESPONSE_RE = re.compile(r"T:(?P<set_temp>.*?)C:(?P<current_temp>\d+.\d+)")

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting temperature for thermocycler lid"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        match = cls.RESPONSE_RE.match(response)
        message = ""

        if match is not None:
            current_temp = match.groupdict()["current_temp"].strip()
            set_temp = match.groupdict()["set_temp"].strip()
            if set_temp == "none":
                message = (
                    f"Temperature for thermocycler lid is not set"
                    f"\nCurrent temperature of lid is {current_temp}C"
                )
            else:
                message = (
                    f"Set temperature for thermocycler lid is {set_temp}C"
                    f"\nCurrent temperature of lid is {current_temp}C"
                )
        return message
