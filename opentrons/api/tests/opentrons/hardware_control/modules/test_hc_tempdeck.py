import asyncio

import pytest

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control import modules, ExecutionManager


@pytest.fixture
def usb_port():
    return USBPort(
        name="",
        hub=None,
        port_number=0,
        device_path="/dev/ot_module_sim_tempdeck0",
    )


@pytest.fixture
async def subject(usb_port: USBPort) -> modules.AbstractModule:
    """Test subject"""
    temp = await modules.build(
        port="/dev/ot_module_sim_tempdeck0",
        usb_port=usb_port,
        type=modules.ModuleType.TEMPERATURE,
        simulating=True,
        hw_control_loop=asyncio.get_running_loop(),
        execution_manager=ExecutionManager(),
    )
    yield temp
    await temp.cleanup()


async def test_sim_initialization(subject: modules.AbstractModule):
    assert isinstance(subject, modules.AbstractModule)


async def test_sim_state(subject: modules.AbstractModule):
    assert subject.temperature == 0
    assert subject.target is None
    assert subject.status == "idle"
    assert subject.live_data["status"] == subject.status
    assert subject.live_data["data"]["currentTemp"] == subject.temperature
    assert subject.live_data["data"]["targetTemp"] == subject.target
    status = subject.device_info
    assert status["serial"] == "dummySerialTD"
    # return v1 if sim_model is not passed
    assert status["model"] == "temp_deck_v1.1"
    assert status["version"] == "dummyVersionTD"


async def test_sim_update(subject: modules.AbstractModule):
    await subject.start_set_temperature(10)
    await subject.await_temperature(None)
    assert subject.temperature == 10
    assert subject.target == 10
    assert subject.status == "holding at target"
    await subject.deactivate()
    assert subject.temperature == 23
    assert subject.target is None
    assert subject.status == "idle"


async def test_revision_model_parsing(subject: modules.AbstractModule):
    subject._device_info["model"] = "temp_deck_v20"
    assert subject.model() == "temperatureModuleV2"
    subject._device_info["model"] = "temp_deck_v4.0"
    assert subject.model() == "temperatureModuleV1"
    del subject._device_info["model"]
    assert subject.model() == "temperatureModuleV1"
    subject._device_info["model"] = "temp_deck_v1.1"
    assert subject.model() == "temperatureModuleV1"
