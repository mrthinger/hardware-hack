"""
opentrons_shared_data.labware: types and functions for accessing labware defs
"""
import json
from typing import Any, Dict, NewType, TYPE_CHECKING

from .. import load_shared_data

if TYPE_CHECKING:
    from .dev_types import LabwareDefinition

Schema = NewType("Schema", Dict[str, Any])


def load_definition(loadname: str, version: int) -> "LabwareDefinition":
    return json.loads(
        load_shared_data(f"labware/definitions/2/{loadname}/{version}.json")
    )


def load_schema() -> Schema:
    return json.loads(load_shared_data("labware/schemas/2.json"))
