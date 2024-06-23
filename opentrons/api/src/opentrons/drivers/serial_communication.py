from typing import List, Optional, Iterator

import serial  # type: ignore[import-untyped]
from serial import Serial
from serial.tools import list_ports  # type: ignore[import-untyped]
import contextlib
import logging

from serial.tools.list_ports_common import ListPortInfo  # type: ignore[import-untyped]

log = logging.getLogger(__name__)

RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30


class SerialNoResponse(Exception):
    pass


def get_ports_by_name(device_name: str) -> List[str]:
    """Returns all serial devices with a given name"""
    filtered_devices = filter(
        lambda device: device_name in device[1], list_ports.comports()
    )
    device_ports = [device[0] for device in filtered_devices]
    return device_ports


def get_port_by_VID(vid: str) -> Optional[ListPortInfo]:
    """Returns first serial device with a given VID"""
    for d in list_ports.comports():
        if d.vid == vid:
            return d[0]
    return None


@contextlib.contextmanager
def serial_with_temp_timeout(
    serial_connection: Serial, timeout: float
) -> Iterator[Serial]:
    """Implements a temporary timeout for a serial connection"""
    saved_timeout = serial_connection.timeout
    if timeout is not None:
        serial_connection.timeout = timeout
    try:
        yield serial_connection
    finally:
        serial_connection.timeout = saved_timeout


def _parse_serial_response(response: bytes, ack: bytes) -> Optional[bytes]:
    if ack in response:
        parsed_response = response.split(ack)[0]
        return parsed_response.strip()
    else:
        return None


def clear_buffer(serial_connection: Serial) -> None:
    serial_connection.reset_input_buffer()


def _write_to_device_and_return(
    cmd: str, ack: str, device_connection: Serial, tag: Optional[str] = None
) -> str:
    """Writes to a serial device.
    - Formats command
    - Wait for ack return
    - return parsed response"""

    if not tag:
        tag = device_connection.port

    encoded_write = cmd.encode()
    encoded_ack = ack.encode()
    log.debug(f"{tag}: Write -> {encoded_write!r}")
    device_connection.write(encoded_write)
    response = device_connection.read_until(encoded_ack)
    log.debug(f"{tag}: Read <- {response}")
    if encoded_ack not in response:
        log.warning(f"{tag}: timed out after {device_connection.timeout}")
        raise SerialNoResponse(
            "No response from serial port after {} second(s)".format(
                device_connection.timeout
            )
        )
    clean_response = _parse_serial_response(response, encoded_ack)
    if clean_response:
        return clean_response.decode()
    return ""


def _connect(port_name: str, baudrate: int) -> Serial:
    ser = serial.serial_for_url(
        url=port_name, baudrate=baudrate, timeout=DEFAULT_SERIAL_TIMEOUT
    )
    log.debug(ser)
    return ser


def _attempt_command_recovery(
    command: str, ack: str, serial_conn: Serial, tag: Optional[str] = None
) -> str:
    """Recovery after following a failed write_and_return() attempt"""
    if not tag:
        tag = serial_conn.port
    with serial_with_temp_timeout(serial_conn, RECOVERY_TIMEOUT) as device:
        response = _write_to_device_and_return(command, ack, device, tag=tag)
    if response is None:
        log.debug(f"{tag}: No valid response during _attempt_command_recovery")
        raise RuntimeError(
            "Recovery attempted - no valid serial response "
            "for command: {} in {} seconds".format(command.encode(), RECOVERY_TIMEOUT)
        )
    return response


def write_and_return(
    command: str,
    ack: str,
    serial_connection: Serial,
    timeout: int = DEFAULT_WRITE_TIMEOUT,
    tag: Optional[str] = None,
) -> str:
    """Write a command and return the response"""
    clear_buffer(serial_connection)
    with serial_with_temp_timeout(serial_connection, timeout) as device_connection:
        response = _write_to_device_and_return(command, ack, device_connection, tag)
    return response


def connect(
    device_name: str, port: Optional[str] = None, baudrate: int = 115200
) -> Serial:
    """
    Creates a serial connection.

    Args:
        device_name: defaults to 'Smoothieboard'
        port: the optional port
        baudrate: integer frequency for serial communication

    Returns:
        serial.Serial connection
    """
    if not port:
        port = get_ports_by_name(device_name=device_name)[0]
    log.debug("Device name: {}, Port: {}".format(device_name, port))
    return _connect(port_name=port, baudrate=baudrate)
