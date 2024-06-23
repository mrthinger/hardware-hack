import pytest
from mock import AsyncMock
from opentrons.drivers.asyncio.communication import AsyncSerial
from opentrons.drivers.smoothie_drivers.connection import SmoothieConnection
from opentrons.drivers.command_builder import CommandBuilder
from opentrons.drivers.smoothie_drivers.constants import SMOOTHIE_COMMAND_TERMINATOR


@pytest.fixture
def mock_serial_connection() -> AsyncMock:
    """Mock serial connection."""
    return AsyncMock(spec=AsyncSerial)


# Async because SmoothieConnection.__init__() needs an event loop,
# so this fixture needs to run in an event loop.
@pytest.fixture
async def subject(mock_serial_connection: AsyncMock) -> SmoothieConnection:
    """The test subject."""
    return SmoothieConnection(
        serial=mock_serial_connection,
        port="",
        ack="\r\n",
        name="",
        retry_wait_time_seconds=0,
        error_keyword="error",
        alarm_keyword="alarm",
    )


@pytest.fixture
def command() -> CommandBuilder:
    """A command fixture"""
    return (
        CommandBuilder(terminator=SMOOTHIE_COMMAND_TERMINATOR)
        .add_gcode("M123")
        .add_int("F", 2)
    )


async def test_command_sender_sanitized_response(
    subject: SmoothieConnection,
    mock_serial_connection: AsyncMock,
    command: CommandBuilder,
) -> None:
    """It should return sanitized result."""
    sanitized_body = "a"
    full_body = f"{command.build()}\r\n  {sanitized_body}  \r\n"

    mock_serial_connection.read_until.return_value = full_body.encode()

    result = await subject.send_command(command=command, retries=3)
    assert result == sanitized_body


@pytest.mark.parametrize(
    argnames=["cmd", "resp", "expected"],
    argvalues=[
        # Remove command from response
        ["G28.2B", "G28.2B", ""],
        ["G28.2B G1", "G28.2B G1", ""],
        ["G28.2B G1", "G1G28.2BG1", ""],
        # Remove command and whitespace from response
        ["\r\nG52\r\n\r\n", "\r\nG52\r\n\r\n", ""],
        [
            "\r\nG52\r\n\r\nsome-data\r\nok\r\n",
            "\r\nG52\r\n\r\nsome-data\r\nok\r\nTESTS-RULE",
            "TESTS-RULE",
        ],
        [
            "\r\nG52\r\n\r\nsome-data\r\nok\r\n",
            "G52\r\n\r\nsome-data\r\nokT\r\nESTS-RULE",
            "TESTS-RULE",
        ],
        # L is not a command echo but a token
        ["M371 L \r\n\r\n", "L:703130", "L:703130"],
        # R is not a command echo but a token
        ["M3 R \r\n\r\n", "M3R:703130", "R:703130"],
        [
            "M369 L \r\n\r\n",
            "M369 L \r\n\r\nL:5032304D56323032303230303432323036000000000000000000000000000000",
            "L:5032304D56323032303230303432323036000000000000000000000000000000",
        ],
    ],
)
def test_remove_serial_echo(cmd: str, resp: str, expected: str):
    """It should remove unwanted characters only."""
    res = SmoothieConnection._remove_unwanted_characters(cmd, resp)
    assert res == expected
