from opentrons import APIVersion

from opentrons.hardware_control.emulation.settings import (
    Settings,
    SmoothieSettings,
    PipetteSettings,
)
from g_code_test_data.g_code_configuration import ProtocolGCodeConfirmConfig
from opentrons.hardware_control.emulation.types import ModuleType
import pytest


###################
# Shared Settings #
###################

SWIFT_SMOOTHIE_SETTINGS = Settings(
    smoothie=SmoothieSettings(
        left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        right=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
    ),
)

# Set up the temperature ramp.
SWIFT_SMOOTHIE_SETTINGS.thermocycler.lid_temperature.degrees_per_tick = 50
SWIFT_SMOOTHIE_SETTINGS.thermocycler.plate_temperature.degrees_per_tick = 50
SWIFT_SMOOTHIE_SETTINGS.tempdeck.temperature.degrees_per_tick = 50

##################
# Configurations #
##################

BASIC_SMOOTHIE = ProtocolGCodeConfirmConfig(
    name="basic_smoothie",
    path="protocol/protocols/fast/smoothie_protocol.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    ),
)

BECKMAN = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/beckman_coulter_rna_advance_viral_rna_isolation.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_multi_v2.1", id="P20SV202020070101"),
        )
    ),
)

CHERRY_PICKING = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/cherrypicking.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    ),
)

CUSTOMIZABLE_SERIAL_DILUTION = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/customizable_serial_dilution_ot2.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_multi_v2.1", id="P20SV202020070101"),
        ),
    ),
)

TWO_SINGLE_CHANNEL = ProtocolGCodeConfirmConfig(
    name="2_single_channel",
    path="protocol/protocols/fast/2_single_channel_v2.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
            right=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
        )
    ),
)

SET_MAX_SPEED = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/set_max_speed.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=SWIFT_SMOOTHIE_SETTINGS,
)

TWO_MODULES = ProtocolGCodeConfirmConfig(
    name="2_modules",
    path="protocol/protocols/slow/2_modules_1s_1m_v2.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_multi_v2.1", id="P20SV202020070101"),
        ),
    ),
)


OPENTRONS_LOGO = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/opentrons_logo.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
        ),
    ),
)

OMEGA = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/slow/omega_biotek_magbind_totalpure_ngs.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p1000_single_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p300_single_v2.1", id="P20SV202020070101"),
        ),
    ),
)

ILLUMINA = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/illumina_nextera_xt_library_prep_part1.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p20_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    ),
)

PCR_PREP_PART_1 = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/pcr_prep_part_1.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p1000_single_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p1000_single_v2.1", id="P20SV202020070101"),
        )
    ),
)

PCR_PREP_PART_2 = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/fast/pcr_prep_part_2.py",
    versions={APIVersion(2, 12), APIVersion(2, 13),APIVersion(2, 14)},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
        )
    ),
)

SWIFT_SMOKE = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/slow/swift_smoke.py",
    versions={APIVersion(2, 12), APIVersion(2, 13), APIVersion(2, 14)},
    settings=SWIFT_SMOOTHIE_SETTINGS,
)

SWIFT_TURBO = ProtocolGCodeConfirmConfig(
    path="protocol/protocols/slow/swift_turbo.py",
    versions={APIVersion(2, 12), APIVersion(2, 13)},
    settings=SWIFT_SMOOTHIE_SETTINGS,
)

# JSON v6 protocols

NO_MODS = ProtocolGCodeConfirmConfig(
    name="no_mods",
    path="protocol/protocols/fast/OT2_P300M_P20S_NoMod_6_1_MixTransferManyLiquids.json",
    versions={6},
    settings=Settings(
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    ),
)

JSON_SMOKE = ProtocolGCodeConfirmConfig(
    name="json_smoke",
    path="protocol/protocols/fast/OT2_P300M_P20S_HS_TM_6_3_SmokeV3.json",
    versions={6},
    settings=Settings(
        modules=[ModuleType.Temperature, ModuleType.Heatershaker],
        smoothie=SmoothieSettings(
            left=PipetteSettings(model="p300_multi_v2.1", id="P20SV202020070101"),
            right=PipetteSettings(model="p20_single_v2.0", id="P20SV202020070101"),
        )
    ),
)

SLOW_PROTOCOLS = [
    OMEGA,
    SWIFT_SMOKE,
    SWIFT_TURBO,
    TWO_MODULES,
]


for configuration in SLOW_PROTOCOLS:
    configuration.add_mark(user_mark=pytest.mark.slow)


FAST_PROTOCOLS = [
    BASIC_SMOOTHIE,
    BECKMAN,
    CHERRY_PICKING,
    CUSTOMIZABLE_SERIAL_DILUTION,
    ILLUMINA,
    OPENTRONS_LOGO,
    PCR_PREP_PART_1,
    PCR_PREP_PART_2,
    SET_MAX_SPEED,
    TWO_SINGLE_CHANNEL,
    NO_MODS,
    JSON_SMOKE,
]

PROTOCOL_CONFIGURATIONS = SLOW_PROTOCOLS + FAST_PROTOCOLS
