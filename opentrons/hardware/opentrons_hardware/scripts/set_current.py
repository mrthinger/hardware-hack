"""A very simple script to set motor currents."""
import os
import argparse
import asyncio
import json
import logging
from logging.config import dictConfig
from typing import Dict, Tuple

from opentrons_hardware.drivers.can_bus import build
from opentrons_hardware.firmware_bindings.constants import NodeId

from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    with open(args.params_file_path, "r") as f:
        current_params = json.load(f)

    currents: Dict[NodeId, Tuple[float, float]] = {}
    for k, v in current_params.items():
        currents[NodeId[k]] = (float(v["hold_current"]), float(v["run_current"]))

    async with build.can_messenger(build_settings(args)) as messenger:
        try:
            await set_currents(messenger, currents)
        except asyncio.CancelledError:
            pass


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description="CAN bus set currents.")

    add_can_args(parser)

    parser.add_argument(
        "--params-file-path",
        "-p",
        type=str,
        required=False,
        default=os.path.join(os.path.dirname(__file__) + "/currents_config.json"),
        help="the parameter file path",
    )

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
