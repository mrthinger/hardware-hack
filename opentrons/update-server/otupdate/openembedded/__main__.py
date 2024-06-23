"""
Entrypoint for the openembedded update server
"""
import asyncio
import logging
from typing import NoReturn

from . import get_app

from otupdate.common import name_management, cli, systemd, constants
from otupdate.common.run_application import run_and_notify_up


LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    parser = cli.build_root_parser()
    args = parser.parse_args()

    systemd.configure_logging(getattr(logging, args.log_level.upper()))

    # Because this involves restarting Avahi, this must happen early,
    # before the NameSynchronizer starts up and connects to Avahi.
    LOG.info("Setting static hostname")
    static_hostname = await name_management.set_up_static_hostname()
    LOG.info(f"Set static hostname to {static_hostname}")

    async with name_management.NameSynchronizer.start(
        constants.MODEL_OT3
    ) as name_synchronizer:
        LOG.info("Building openembedded update server")
        app = await get_app(
            system_version_file=args.version_file,
            config_file_override=args.config_file,
            name_synchronizer=name_synchronizer,
        )

        LOG.info(
            f"Starting openembedded update server on http://{args.host}:{args.port}"
        )
        await run_and_notify_up(app=app, host=args.host, port=args.port)


if __name__ == "__main__":
    asyncio.run(main())
