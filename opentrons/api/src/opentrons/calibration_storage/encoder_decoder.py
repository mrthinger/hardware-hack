""" opentrons.calibration_storage.encoder_decoder: classes that
allow you to customize serialization to/from json.
"""
import json
import datetime
from typing import Any, cast


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj: object) -> Any:
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)


class DateTimeDecoder(json.JSONDecoder):
    def __init__(self) -> None:
        super().__init__(object_hook=self.dict_to_obj)

    def dict_to_obj(self, d: object) -> Any:
        if isinstance(d, dict):
            d = {k: self._decode_datetime(v) for k, v in d.items()}
        return d

    def _decode_datetime(self, obj: object) -> Any:
        try:
            return datetime.datetime.fromisoformat(cast(str, obj))
        except ValueError:
            return obj
        except TypeError:
            return self.dict_to_obj(obj)
