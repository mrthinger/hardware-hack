# G-Code Parser

Framework supporting the following:

- Running protocols against emulation
- Capturing called G-Codes of emulated protocols
- Parsing captured G-Codes into human-readable text or JSON format
- Diffing human-readable text or JSON format
- CLI access to all the above features

- [Setup](#setup)
- [Running tests](#running-tests)
  - [Acceptance Tests](#acceptance-tests)
  - [G-Code Program Tests](#g-code-program-tests)
    - [Fast G-Code Program Tests](#fast-g-code-program-tests)
    - [Slow G-Code Program Tests](#slow-g-code-program-tests)
- [Running Individual G-Code Programs Manually](#running-individual-g-code-programs-manually)
  - [Get Configuration Names](#get-configuration-names)
  - [Run G-Code Program](#run-g-code-program)
  - [Load Stored G-Code Program Comparison](#load-stored-g-code-program-comparison)
  - [Print Diff Between Comparison and Local Code](#print-diff-between-comparison-and-local-code)
  - [Update Storage Comparision](#update-storage-comparison)

## Setup

1. Navigate into `g-code-testing` directory
2. Run `make setup`

## Running tests

### Acceptance Tests

To run `g-code-testing` framework acceptance tests run

```bash
make test
```

### G-Code Program Tests

The G-Code Program tests run various protocols or HTTP requests, capture the sent G-Codes, and compare them against
comparison files in `g_code_test_data/comparison_files`

#### Fast G-Code Program Tests

All G-Code program test cases that take under a minute are grouped together in one execution `test-g-code-fast`

To run these run

```bash
make test-g-code-fast
```

#### Slow G-Code Program Tests

All G-Code program tests that take over a minute are pulled out into their own Makefile target so they can be called
in parallel inside a Github Action.

To run these run the specific make target related to the test.

For instance, to run the `swift-turbo` test run

```bash
make test-g-code-swift-turbo
```

## Running Individual G-Code Programs Manually

You can run the various G-Code Programs without pytest, directly in your terminal with the following commands:

### Get Configuration Names

`make get-g-code-configurations` prints a list of all available g-code programs to run. Use these printed names
to specify which program to run.

**Command:**

```bash
make get-g-code-configurations
```

**Sample Output:**

**Note:** All `protocol/` configurations have a version number that represents what `APIversion` or `schema_version` the protocol will run against.

```shell
Runnable Configurations:
http/magdeck_calibrate
http/magdeck_deactivate
http/magdeck_engage
http/robot_home_left_pipette
http/robot_home_right_pipette
http/robot_home_robot
http/robot_move_left_mount
http/robot_move_left_pipette
http/robot_move_right_mount
http/robot_move_right_pipette
http/tempdeck_deactivate
http/tempdeck_start_set_temperature
http/thermocycler_close
http/thermocycler_cycle_temperatures
http/thermocycler_deactivate
http/thermocycler_deactivate_block
http/thermocycler_deactivate_lid
http/thermocycler_open
http/thermocycler_set_lid_temperature
http/thermocycler_set_temperature
protocols/2_modules/2.12
protocols/2_modules/2.13
protocols/2_single_channel/2.12
protocols/2_single_channel/2.13
protocols/basic_smoothie/2.12
protocols/basic_smoothie/2.13
protocols/beckman_coulter_rna_advance_viral_rna_isolation/2.12
protocols/beckman_coulter_rna_advance_viral_rna_isolation/2.13
protocols/cherrypicking/2.12
protocols/cherrypicking/2.13
protocols/customizable_serial_dilution_ot2/2.12
protocols/customizable_serial_dilution_ot2/2.13
protocols/illumina_nextera_xt_library_prep_part1/2.12
protocols/illumina_nextera_xt_library_prep_part1/2.13
protocols/json_smoke/6
protocols/no_mods/6
protocols/omega_biotek_magbind_totalpure_ngs/2.12
protocols/omega_biotek_magbind_totalpure_ngs/2.13
protocols/opentrons_logo/2.12
protocols/opentrons_logo/2.13
protocols/pcr_prep_part_1/2.12
protocols/pcr_prep_part_1/2.13
protocols/pcr_prep_part_2/2.12
protocols/pcr_prep_part_2/2.13
protocols/pcr_prep_part_2/2.14
protocols/set_max_speed/2.12
protocols/set_max_speed/2.13
protocols/swift_smoke/2.12
protocols/swift_smoke/2.13
protocols/swift_smoke/2.14
protocols/swift_turbo/2.12
protocols/swift_turbo/2.13
```

### G-Code Command Globbing

The following commands support globbing of the passed `name` argument:

- `run-g-code-configuration`
- `load-g-code-configuration-comparison`
- `diff-g-code-configuration-comparison`
- `update-g-code-configuration-comparison`

Examples:

- Run all `protocols` configurations
  - `make run-g-code-configuration name=protocols/*/*`
- Load all `basic_smoothie` configurations with versions 2.1x or greater
  - `make load-g-code-configuration-comparison name=protocols/basic_smoothie/2.1*`
- Diff all `basic_smoothie` configurations
  - `make diff-g-code-configuration-comparison name=protocols/basic_smoothie/*`
- Update all `http` configurations
  - `make update-g-code-configuration-comparison name=http/*`
- Run all `magdeck` configurations
  - `make run-g-code-configuration name=http/magdeck*`

### Run G-Code Program

To run the G-Code Program locally use `run-g-code-configuration` and specify the name of the program you want to run.

**Command:**

```bash
make run-g-code-configuration name=protocols/swift_turbo/2.13
```

### Load Stored G-Code Program Comparison

To load the stored comparison file use `load-g-code-configuration-comparison`

**Command:**

```bash
make load-g-code-configuration-comparison name=protocols/swift_turbo/2.13
```

### Print Diff Between Comparison and Local Code

To run the G-Code Program locally and print the diff between the result and the stored comparison use
`diff-g-code-configuration-comparison`

**Command:**

```bash
make diff-g-code-configuration-comparison name=protocol/2.13/swift_turbo
```

### Update Storage Comparison

To update comparison files, with output of a locally ran G-Code Program, use `update-g-code-configuration-comparison`

**Command:**

```bash
make update-g-code-configuration-comparison name=protocol/2.13/swift_turbo
```

## Adding New Protocol to Run

To add a new protocol to run follow these steps:

1. Add your python protocol to your local system
2. Go to `g-code-testing/g_code_test_data/protocol/protocols` there will be 2
   directories `fast` & `slow`
3. If your protocol takes under 2 minutes to run put it in the `fast` directory,
   otherwise put it in the `slow` directories
4. Open `g-code-testing/g_code_test_data/protocol/protocol_configurations.py`
5. Copy and paste one of the existing configurations. It will look something like the following.

```python
BASIC_SMOOTHIE = ProtocolGCodeConfirmConfig(
    name='basic_smoothie',
    path="protocol/protocols/fast/smoothie_protocol.py",
    results_dir=DIRECTORY,
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    )
)
```

6. Update the `name` field to a name unique to all existing protocol configurations
7. Update the `path` field to relative path to your protocol
8. Update `versions` field to versions that you want to run
   1. The field must be a set of APIVersion objects.
9. Update each of the `Pipette Settings` object on the `settings` field to the pipette model you want
10. If the protocol is a `slow` protocol add it to the `SLOW_PROTOCOLS` constant at the bottom of the file.
    Otherwise, add it to the `FAST_PROTOCOLS` constant

## Generating Non-existent Comparison Files

When either you add a new protocol or add a new version to an existing protocol, you need to
generate a comparison file. To do this follow these steps:

1. Run `make check-for-missing-comparison-files` and confirm that it errors out, and lists your
   new protocol/new version as missing
2. Run `make get-g-code-configurations` and verify that your protocol configuration shows up in the list
   1. Configuration will be in format of `protocol/<protocol_name>/<version>`
3. Run `make run-g-code-configuration name=<configuration_path>` and verify the output of your
   protocol is correct.
4. Run `make update-g-code-configuration-comparison name=<configuration_path>`
5. Run `make check-for-missing-comparison-files` and confirm that your protocol no longer shows
   up as having a missing comparison file.
