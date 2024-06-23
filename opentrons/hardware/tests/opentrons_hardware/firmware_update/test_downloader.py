"""Tests for the firmware downloader."""
import binascii
from typing import List

import pytest
from mock import AsyncMock, MagicMock, call
from opentrons_hardware.firmware_bindings import (
    NodeId,
    utils,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.firmware_bindings.constants import ErrorCode
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    FirmwareUpdateData,
    FirmwareUpdateComplete,
    FirmwareUpdateDataAcknowledge,
    FirmwareUpdateCompleteAcknowledge,
    SingletonMessageIndexGenerator,
)
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.fields import ErrorCodeField

from opentrons_hardware.firmware_update import downloader
from opentrons_hardware.firmware_update.errors import ErrorResponse, TimeoutResponse
from opentrons_hardware.firmware_update.hex_file import HexRecordProcessor, Chunk
from tests.conftest import MockCanMessageNotifier


@pytest.fixture
def mock_hex_processor() -> MagicMock:
    """Mock hex file record producer."""
    return MagicMock(spec=HexRecordProcessor)


@pytest.fixture
def chunks() -> List[Chunk]:
    """Data chunks produced by hex processor."""
    return [
        Chunk(address=0x000, data=list(range(48))),
        Chunk(address=0x100, data=[5, 6, 7, 8]),
        Chunk(address=0x200, data=[100, 121]),
    ]


@pytest.fixture
def crc32(chunks: List[Chunk]) -> int:
    """crc32 of data chunks."""
    val = 0
    for c in chunks:
        val = binascii.crc32(bytes(c.data), val)
    return val


@pytest.fixture
def subject(mock_messenger: AsyncMock) -> downloader.FirmwareUpdateDownloader:
    """Test subject."""
    return downloader.FirmwareUpdateDownloader(mock_messenger)


async def test_messaging(
    subject: downloader.FirmwareUpdateDownloader,
    chunks: List[Chunk],
    mock_hex_processor: MagicMock,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
    crc32: int,
) -> None:
    """It should send all the chunks as CAN messages."""
    # TODO (amit, 2022-1-27): Replace this test with integration test.
    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, FirmwareUpdateData):
            FwUpData_payload = payloads.FirmwareUpdateDataAcknowledge(
                address=message.payload.address,
                error_code=ErrorCodeField(ErrorCode.ok),
            )
            FwUpData_payload.message_index = message.payload.message_index
            can_message_notifier.notify(
                FirmwareUpdateDataAcknowledge(payload=FwUpData_payload),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateDataAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )
        elif isinstance(message, FirmwareUpdateComplete):
            FwUpCom_payload = payloads.FirmwareUpdateAcknowledge(
                error_code=ErrorCodeField(ErrorCode.ok)
            )
            FwUpCom_payload.message_index = message.payload.message_index
            can_message_notifier.notify(
                FirmwareUpdateCompleteAcknowledge(payload=FwUpCom_payload),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateCompleteAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    mock_hex_processor.process.return_value = iter(chunks)

    async for progress in subject.run(
        NodeId.gantry_y_bootloader, mock_hex_processor, 10
    ):
        pass

    # When the downloader runs it creates unique message indecies for each
    # message, this is a little hack to get the next index it would use
    # so we can caluclate what indecies it gave the messages.
    index_generator = SingletonMessageIndexGenerator()
    msg_index = index_generator.get_next_index() - (len(chunks) + 1)

    mock_messenger.send.assert_has_calls(
        [
            call(
                node_id=NodeId.gantry_y_bootloader,
                message=FirmwareUpdateData(
                    payload=payloads.FirmwareUpdateData.create(
                        address=chunk.address,
                        data=bytes(chunk.data),
                        message_index=msg_index + i,
                    )
                ),
            )
            for i, chunk in enumerate(chunks)
        ]
        + [
            call(
                node_id=NodeId.gantry_y_bootloader,
                message=FirmwareUpdateComplete(
                    payload=payloads.FirmwareUpdateComplete(
                        num_messages=utils.UInt32Field(len(chunks)),
                        crc32=utils.UInt32Field(crc32),
                    )
                ),
            )
        ]
    )


async def test_messaging_data_error_response(
    subject: downloader.FirmwareUpdateDownloader,
    chunks: List[Chunk],
    mock_hex_processor: MagicMock,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should fail due to error response to data message."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, FirmwareUpdateData):
            can_message_notifier.notify(
                FirmwareUpdateDataAcknowledge(
                    payload=payloads.FirmwareUpdateDataAcknowledge(
                        address=message.payload.address,
                        error_code=ErrorCodeField(ErrorCode.bad_checksum),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateDataAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    mock_hex_processor.process.return_value = iter(chunks)

    with pytest.raises(ErrorResponse):
        async for progress in subject.run(
            NodeId.gantry_y_bootloader, mock_hex_processor, 10
        ):
            pass


async def test_messaging_complete_error_response(
    subject: downloader.FirmwareUpdateDownloader,
    chunks: List[Chunk],
    mock_hex_processor: MagicMock,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should fail due to error response to update complete message."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, FirmwareUpdateData):
            can_message_notifier.notify(
                FirmwareUpdateDataAcknowledge(
                    payload=payloads.FirmwareUpdateDataAcknowledge(
                        address=message.payload.address,
                        error_code=ErrorCodeField(ErrorCode.ok),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateDataAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )
        elif isinstance(message, FirmwareUpdateComplete):
            can_message_notifier.notify(
                FirmwareUpdateCompleteAcknowledge(
                    payload=payloads.FirmwareUpdateAcknowledge(
                        error_code=ErrorCodeField(ErrorCode.invalid_size)
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateCompleteAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    mock_hex_processor.process.return_value = iter(chunks)

    with pytest.raises(ErrorResponse):
        async for progress in subject.run(
            NodeId.gantry_y_bootloader, mock_hex_processor, 10
        ):
            pass


async def test_messaging_data_no_response(
    subject: downloader.FirmwareUpdateDownloader,
    chunks: List[Chunk],
    mock_hex_processor: MagicMock,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should fail with timeout waiting for data response."""
    mock_hex_processor.process.return_value = iter(chunks)

    with pytest.raises(TimeoutResponse):
        async for progress in subject.run(
            NodeId.gantry_y_bootloader, mock_hex_processor, 0.5
        ):
            pass


async def test_messaging_complete_no_response(
    subject: downloader.FirmwareUpdateDownloader,
    chunks: List[Chunk],
    mock_hex_processor: MagicMock,
    mock_messenger: AsyncMock,
    can_message_notifier: MockCanMessageNotifier,
) -> None:
    """It should fail with timeout waiting for complete response."""

    def responder(node_id: NodeId, message: MessageDefinition) -> None:
        """Message responder."""
        if isinstance(message, FirmwareUpdateData):
            can_message_notifier.notify(
                FirmwareUpdateDataAcknowledge(
                    payload=payloads.FirmwareUpdateDataAcknowledge(
                        address=message.payload.address,
                        error_code=ErrorCodeField(ErrorCode.ok),
                    )
                ),
                ArbitrationId(
                    parts=ArbitrationIdParts(
                        message_id=FirmwareUpdateDataAcknowledge.message_id,
                        node_id=NodeId.host,
                        function_code=0,
                        originating_node_id=node_id,
                    )
                ),
            )

    mock_messenger.send.side_effect = responder

    mock_hex_processor.process.return_value = iter(chunks)

    with pytest.raises(TimeoutResponse):
        async for progress in subject.run(
            NodeId.gantry_y_bootloader, mock_hex_processor, 0.5
        ):
            pass
