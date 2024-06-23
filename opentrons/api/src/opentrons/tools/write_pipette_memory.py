import asyncio
from opentrons.drivers.smoothie_drivers import SmoothieDriver

from . import args_handler

BAD_BARCODE_MESSAGE = "Unexpected Serial -> {}"
WRITE_FAIL_MESSAGE = "Data not saved, HOLD BUTTON"

# must iterate through v1.4 and v1.3 first, because v1 barcodes did not
# have characters to specify the version number
VERSIONS = ["v2.2", "v2.1", "v2", "v1.6", "v1.5", "v1.4", "v1.3", "v1"]

MODELS = {
    "v1": {
        "P10S": "p10_single_v1",
        "P10M": "p10_multi_v1",
        "P50S": "p50_single_v1",
        "P50M": "p50_multi_v1",
        "P300S": "p300_single_v1",
        "P300M": "p300_multi_v1",
        "P1000S": "p1000_single_v1",
    },
    "v1.3": {
        "P10SV13": "p10_single_v1.3",
        "P10MV13": "p10_multi_v1.3",
        "P50SV13": "p50_single_v1.3",
        "P50MV13": "p50_multi_v1.3",
        "P3HSV13": "p300_single_v1.3",
        "P3HMV13": "p300_multi_v1.3",
        "P1KSV13": "p1000_single_v1.3",
    },
    "v1.4": {
        "P10SV14": "p10_single_v1.4",
        "P10MV14": "p10_multi_v1.4",
        "P50SV14": "p50_single_v1.4",
        "P50MV14": "p50_multi_v1.4",
        "P3HSV14": "p300_single_v1.4",
        "P3HMV14": "p300_multi_v1.4",
        "P1KSV14": "p1000_single_v1.4",
    },
    "v1.5": {
        "P10SV15": "p10_single_v1.5",
        "P10MV15": "p10_multi_v1.5",
        "P50SV15": "p50_single_v1.5",
        "P50MV15": "p50_multi_v1.5",
        "P3HSV15": "p300_single_v1.5",
        "P3HMV15": "p300_multi_v1.5",
        "P1KSV15": "p1000_single_v1.5",
    },
    "v1.6": {
        "P10MV16": "p10_multi_v1.6",
    },
    "v2": {
        "P3HSV20": "p300_single_v2.0",
        "P3HMV20": "p300_multi_v2.0",
        "P1KSV20": "p1000_single_v2.0",
        "P20SV20": "p20_single_v2.0",
        "P20MV20": "p20_multi_v2.0",
    },
    "v2.1": {
        "P3HSV21": "p300_single_v2.1",
        "P1KSV21": "p1000_single_v2.1",
        "P20SV21": "p20_single_v2.1",
        "P3HMV21": "p300_multi_v2.1",
        "P20MV21": "p20_multi_v2.1",
    },
    "v2.2": {
        "P20MV22": "p20_multi_v2.2",
        "P20SV22": "p20_single_v2.2",
        "P1KSV22": "p1000_single_v2.2",
    },
}


async def write_identifiers(
    mount: str, new_id: str, new_model: str, driver: SmoothieDriver
) -> None:
    """
    Send a bytearray to the specified mount, so that Smoothieware can
    save the bytes to the pipette's memory
    """
    await driver.write_pipette_id(mount, new_id)
    read_id = await driver.read_pipette_id(mount)
    _assert_the_same(new_id, read_id)
    await driver.write_pipette_model(mount, new_model)
    read_model = await driver.read_pipette_model(mount)
    _assert_the_same(new_model, read_model)


async def check_previous_data(mount: str, driver: SmoothieDriver) -> None:
    old_id = await driver.read_pipette_id(mount)
    old_model = await driver.read_pipette_model(mount)
    if old_id and old_model:
        print("Overwriting old data: id={0}, model={1}".format(old_id, old_model))
    else:
        print("No old data on this pipette")


def _assert_the_same(a: object, b: object) -> None:
    if a != b:
        raise Exception(WRITE_FAIL_MESSAGE)


def _user_submitted_barcode(max_length: int) -> str:
    """
    User can enter a serial number as a string of HEX values
    Length of byte array must equal `num`
    """
    barcode = input("BUTTON + SCAN: ").strip()
    if len(barcode) > max_length:
        raise Exception(BAD_BARCODE_MESSAGE.format(barcode))
    # remove all characters before the letter P
    # for example, remove ASCII selector code "\x1b(B" on chinese keyboards
    barcode = barcode[barcode.index("P") :]
    barcode = barcode.split("\r")[0].split("\n")[0]  # remove any newlines
    return barcode


def _parse_model_from_barcode(barcode: str) -> str:
    for version in VERSIONS:
        for barcode_substring in MODELS[version].keys():
            if barcode.startswith(barcode_substring):
                return MODELS[version][barcode_substring]
    raise Exception(BAD_BARCODE_MESSAGE.format(barcode))


async def _do_wpm(mount: str, driver: SmoothieDriver) -> None:
    try:
        barcode = _user_submitted_barcode(32)
        model = _parse_model_from_barcode(barcode)
        await check_previous_data(mount, driver)
        await write_identifiers(mount, barcode, model, driver)
        print("PASS: Saved -> {0} (model {1})".format(barcode, model))
    except KeyboardInterrupt:
        exit()
    except Exception as e:
        print("FAIL: {}".format(e))


async def main() -> None:
    parser = args_handler.root_argparser("Write model and serial to a pipette's eeprom")
    parser.add_argument(
        "-m",
        "--mount",
        help="mount to use",
        default="right",
        type=str,
        choices=["left", "right"],
    )
    args = parser.parse_args()
    _, driver = await args_handler.build_driver(args.port)
    while True:
        await _do_wpm(args.mount, driver)


if __name__ == "__main__":
    asyncio.run(main())
