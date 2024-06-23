from typing import Dict
from g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (
    GCodeFunctionalityDefBase,
)
from opentrons.drivers.smoothie_drivers.parse_utils import byte_array_to_ascii_string


class ReadInstrumentModelGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    SIDE_EXPANSION_DICT = {"L": "Left", "R": "Right"}

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        left_or_right = cls.SIDE_EXPANSION_DICT[list(g_code_args.keys())[0]]

        return f"Reading instrument model for {left_or_right} pipette"

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        hex_string = response.split(":")[-1].strip()
        instrument_model = byte_array_to_ascii_string(bytearray.fromhex(hex_string))
        return f"Read Instrument Model: {instrument_model}"
