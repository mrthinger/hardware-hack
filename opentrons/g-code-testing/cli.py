"""Command Line Interface for making use of G-Code Parsing Commands."""
from __future__ import annotations
import asyncio
from functools import partial
import os
import sys
import re
import argparse
from dataclasses import dataclass
from pathlib import PurePath
import time
from typing import (
    Callable,
    Dict,
    Any,
    List,
    Optional,
    Union,
)

from opentrons import APIVersion

from g_code_parsing.errors import UnparsableCLICommandError
from g_code_parsing.g_code_differ import GCodeDiffer
from g_code_test_data.g_code_configuration import (
    HTTPGCodeConfirmConfig,
    ProtocolGCodeConfirmConfig,
)
from g_code_test_data.http.http_configurations import HTTP_CONFIGURATIONS
from g_code_test_data.protocol.protocol_configurations import PROTOCOL_CONFIGURATIONS


@dataclass
class RunnableConfiguration:
    """All the information necessary to perform an operation against a configuration."""

    configuration: Union[ProtocolGCodeConfirmConfig, HTTPGCodeConfirmConfig]
    version: Optional[Union[APIVersion, int]]

    def __hash__(self) -> int:
        """Make it hashable."""
        return hash(repr(self))


class GCodeCLI:
    """CLI for G-Code Parser.

    Takes input from command line, parses it and performs any post-processing.
    The provides run_command method to run passed input.
    """

    COMMAND_KEY = "command"

    RUN_COMMAND = "run"
    CONFIGURATION_NAME = "configuration_name"

    DIFF_FILES_COMMAND = "diff"
    FILE_PATH_1_KEY = "file_path_1"
    FILE_PATH_2_KEY = "file_path_2"
    ERROR_ON_DIFFERENT_FILES = "error_on_different_files"
    ERROR_ON_MISSING_FILES = "error_on_missing_configuration_files"

    CONFIGURATION_COMMAND = "configurations"
    CONFIGURATIONS = HTTP_CONFIGURATIONS + PROTOCOL_CONFIGURATIONS

    LOAD_COMPARISON_COMMAND = "load-comparison"
    UPDATE_COMPARISON_COMMAND = "update-comparison"
    CHECK_MISSING_COMP_FILES = "check-for-missing-comparison-files"

    API_VERSION_REGEX = re.compile(r"\/(\d+\.\d+)$")

    @classmethod
    def parse_args(cls, args: List[str]) -> Dict[str, Any]:
        """Parse args from arg list."""
        parsed_dict = vars(cls.parser().parse_args(args))
        return parsed_dict

    @classmethod
    def _create_configuration_dict(
        cls,
    ) -> Dict[str, Union[HTTPGCodeConfirmConfig, ProtocolGCodeConfirmConfig]]:
        """Create lookup dict for configurations."""
        configurations = {}
        for conf in cls.CONFIGURATIONS:
            if isinstance(conf, ProtocolGCodeConfirmConfig):
                for version in conf.versions:
                    configurations[conf.get_configuration_paths(version)] = conf
            else:
                configurations[conf.get_configuration_paths()] = conf
        return configurations

    def __init__(self) -> None:
        """Init GCodeCLI object."""
        self._args = self.parse_args(sys.argv[1:])
        self.configurations = self._create_configuration_dict()
        self.respond_with_error_code = False

    @classmethod
    async def create(cls) -> GCodeCLI:
        """Create GCodeCLI object."""
        self = GCodeCLI()
        self._command_lookup_dict = {
            self.RUN_COMMAND: self._run,
            self.DIFF_FILES_COMMAND: self._diff,
            self.LOAD_COMPARISON_COMMAND: self._pull,
            self.UPDATE_COMPARISON_COMMAND: self._update_comparison,
            self.CONFIGURATION_COMMAND: self._configurations,
            self.CHECK_MISSING_COMP_FILES: self._check_for_missing_comparison_files,
        }
        return self

    @staticmethod
    async def _run(run_config: RunnableConfiguration) -> str:
        """Execute G-Code Configuration."""
        configuration = run_config.configuration
        version = run_config.version
        return (
            await configuration.execute(version)
            if version is not None
            else await configuration.execute()
        )

    async def _diff(self, run_config: RunnableConfiguration) -> str:
        """Diff G-Code Configuration against stored comparison file."""
        configuration = run_config.configuration
        version = run_config.version
        able_to_respond_with_error_code = self.args[self.ERROR_ON_DIFFERENT_FILES]

        if version is not None:
            actual = await configuration.execute(version)
            expected = configuration.get_comparison_file(version)
        else:
            actual = await configuration.execute()
            expected = configuration.get_comparison_file()

        differ = GCodeDiffer(actual, expected)
        strings_equal = differ.strings_are_equal()

        if not strings_equal and able_to_respond_with_error_code:
            self.respond_with_error_code = True

        if not strings_equal:
            text = differ.get_html_diff()
            differ.save_html_diff_to_file(
                os.path.join("results", f"{str(time.time_ns())[:-3]}result.html")
            )
        else:
            text = "No difference between compared strings"

        return text

    def _configurations(self) -> str:
        """Get a list of runnable G-Code Configurations."""
        configs = list(self.configurations.keys())
        configs.sort()
        path_string = "\n".join(configs)
        return f"Runnable Configurations:\n{path_string}"

    @staticmethod
    def _pull(run_config: RunnableConfiguration) -> str:
        """Load comparison file."""
        configuration = run_config.configuration
        version = run_config.version
        return (
            configuration.get_comparison_file(version)
            if version is not None
            else configuration.get_comparison_file()
        )

    @staticmethod
    async def _update_comparison(run_config: RunnableConfiguration) -> str:
        """Create/Override comparison file with output of execution."""
        configuration = run_config.configuration
        version = run_config.version
        return (
            await configuration.update_comparison(version)
            if version is not None
            else await configuration.update_comparison()
        )

    def _check_for_missing_comparison_files(self) -> str:
        able_to_respond_with_error_code = self.args[self.ERROR_ON_MISSING_FILES]
        missing_files = set()

        for config in self.configurations.values():
            if isinstance(config, ProtocolGCodeConfirmConfig):
                for version in config.versions:
                    if not config.comparison_file_exists(version):
                        missing_files.add(config.get_comparison_file_path(version))

        missing_files = list(missing_files)
        response = "\nNo missing configuration files."
        if len(missing_files) > 0:
            missing_files_string = "\n".join(missing_files)
            response = (
                f"\nThe following files are missing: \n\n{missing_files_string}\n"
            )

        if len(missing_files) > 0 and able_to_respond_with_error_code:
            self.respond_with_error_code = True

        return response

    def _get_command_func(self, passed_command_name: str) -> Callable:
        try:
            command_func = self._command_lookup_dict[passed_command_name]
        except KeyError:
            raise UnparsableCLICommandError(
                passed_command_name, list(self._command_lookup_dict.keys())
            )
        return command_func

    def _get_config_matches(self, config_string: str) -> List[str]:
        """Gets a list of matches to available configurations. Supports globbing."""
        exact_match = config_string in self.configurations.keys()
        glob_matches = [
            configuration_key
            for configuration_key in self.configurations.keys()
            if PurePath(configuration_key).match(config_string)
            or config_string in configuration_key
        ]

        if exact_match:
            matches = [config_string]
        elif len(glob_matches) > 0:
            matches = glob_matches
        else:
            raise ValueError(f'Configuration path "{config_string}" was not found.')

        return matches

    def _parse_runnable_configs(
        self, config_string_list: List[str]
    ) -> List[RunnableConfiguration]:
        """Parses config_string_list into RunnableConfiguration objects."""
        runnable_configurations = []

        for config_string in config_string_list:
            if config_string.startswith(HTTPGCodeConfirmConfig.results_dir):
                runnable_configurations.append(
                    RunnableConfiguration(
                        configuration=self.configurations[config_string], version=None
                    )
                )
            elif config_string.startswith(ProtocolGCodeConfirmConfig.results_dir):
                version = None
                try:
                    version = APIVersion.from_string(
                        config_string.rsplit("/", maxsplit=1)[-1]
                    )
                except ValueError:
                    version = int(config_string.rsplit("/", maxsplit=1)[-1])
                runnable_configurations.append(
                    RunnableConfiguration(
                        configuration=self.configurations[config_string],
                        version=version,
                    )
                )
            else:
                raise ValueError(
                    "Something happened that wasn't supposed to."
                    f"Cannot find configuration: {config_string}"
                )

        return runnable_configurations

    # Derek Maggio (7/27/22): Split run_command into get_runnable_commands and
    # run_commands to allow for validation that get_runnable_commands is returning the
    # correct commands. Tests for this are in test_cli.py

    def get_runnable_commands(self, is_async: bool = True) -> List[Callable]:
        """Run command and return it's output."""
        passed_command_name = self.args[self.COMMAND_KEY]

        # The check-for-missing-comparison-files and configurations commands do not
        # except a configuration, so we need to run those commands before looking up
        # the config

        if passed_command_name == self.CONFIGURATION_COMMAND:
            return [self._configurations]
        elif passed_command_name == self.CHECK_MISSING_COMP_FILES:
            return [self._check_for_missing_comparison_files]

        config_name = self.args[self.CONFIGURATION_NAME]
        runnable_configurations = self._parse_runnable_configs(
            self._get_config_matches(config_name)
        )

        def async_partial(f: callable, *args: Any) -> callable:
            """Make the partial async."""

            async def f2(*args2: Any) -> Any:
                result = f(*args, *args2)
                if asyncio.iscoroutinefunction(f):
                    result = await result
                return result

            return f2

        if is_async:
            return [
                async_partial(self._get_command_func(passed_command_name), run_config)
                for run_config in runnable_configurations
            ]
        return [
            partial(self._get_command_func(passed_command_name), run_config)
            for run_config in runnable_configurations
        ]

    @staticmethod
    async def run_commands(commands_to_run: List[Callable]) -> str:
        """Runs passed commands and returns their output."""
        out = []
        for command in commands_to_run:
            try:
                out.append(await command())
            except TypeError:
                out.append(command())
        return "\n".join(out)

    @classmethod
    def parser(cls) -> argparse.ArgumentParser:
        """Generates argparse ArgumentParser class for parsing command line input."""
        parser = argparse.ArgumentParser(description="CLI for G-Code Parser")
        subparsers = parser.add_subparsers(
            title="Supported commands",
            dest=cls.COMMAND_KEY,
            required=True,
            metavar=f""
            f"{cls.RUN_COMMAND} | "
            f"{cls.DIFF_FILES_COMMAND} | "
            f"{cls.CONFIGURATION_COMMAND} | "
            f"{cls.LOAD_COMPARISON_COMMAND} | "
            f"{cls.UPDATE_COMPARISON_COMMAND} | "
            f"{cls.CHECK_MISSING_COMP_FILES}",
        )

        run_parser = subparsers.add_parser(
            cls.RUN_COMMAND,
            help="Run a protocol against emulation",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        run_parser.add_argument(
            "configuration_name", type=str, help="Name of configuration you want to run"
        )

        diff_parser = subparsers.add_parser(
            cls.DIFF_FILES_COMMAND, help="Diff 2 G-Code files"
        )
        diff_parser.add_argument(
            f"--{cls.ERROR_ON_DIFFERENT_FILES}",
            help="If set, return code 1 on files with different content",
            action="store_true",
            default=False,
        )
        diff_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to diff",
        )

        subparsers.add_parser(
            cls.CONFIGURATION_COMMAND, help="List of available configurations"
        )

        missing_comp_file_parser = subparsers.add_parser(
            cls.CHECK_MISSING_COMP_FILES,
            help="Check if there are any comparison files missing.",
        )
        missing_comp_file_parser.add_argument(
            f"--{cls.ERROR_ON_MISSING_FILES}",
            help="If set, return code 1 when configuration files are missing",
            action="store_true",
            default=False,
        )

        load_comparison_parser = subparsers.add_parser(
            cls.LOAD_COMPARISON_COMMAND,
            help="Load comparison file content",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        load_comparison_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to pull",
        )

        update_comparison_parser = subparsers.add_parser(
            cls.UPDATE_COMPARISON_COMMAND,
            help="Update comparison file content",
            formatter_class=argparse.RawTextHelpFormatter,
        )
        update_comparison_parser.add_argument(
            "configuration_name",
            type=str,
            help="Name of configuration you want to push",
        )

        return parser

    @property
    def respond_with_error(self) -> bool:
        """Whether ot not CLI should respond with error code on internal error."""
        return self.respond_with_error_code

    @property
    def args(self) -> Dict[str, Any]:
        """Passed CLI args."""
        return self._args


async def main() -> None:
    """Main function."""
    cli = await GCodeCLI.create()
    funcs_to_run = cli.get_runnable_commands()
    output = await cli.run_commands(funcs_to_run)

    if cli.respond_with_error:
        sys.exit(output)
    else:
        print(output)


if __name__ == "__main__":
    asyncio.run(main())
