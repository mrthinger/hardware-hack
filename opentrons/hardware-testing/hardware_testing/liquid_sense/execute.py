"""Logic for running a single liquid probe test."""
from typing import Dict, Any, List, Tuple, Optional
from .report import store_tip_results, store_trial, store_baseline_trial
from opentrons.config.types import LiquidProbeSettings, OutputOptions
from .__main__ import RunArgs
from hardware_testing.gravimetric.workarounds import get_sync_hw_api
from hardware_testing.gravimetric.helpers import (
    _jog_to_find_liquid_height,
)
from hardware_testing.gravimetric.config import LIQUID_PROBE_SETTINGS
from hardware_testing.gravimetric.tips import get_unused_tips
from hardware_testing.data import ui, get_testing_data_directory
from opentrons.hardware_control.types import (
    InstrumentProbeType,
    OT3Mount,
    Axis,
    top_types,
)

from hardware_testing.gravimetric.measurement.scale import Scale
from hardware_testing.gravimetric.measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from opentrons.protocol_api._types import OffDeckType

from opentrons.protocol_api import ProtocolContext, Well, Labware

from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError

try:
    from abr_testing.automation import google_sheets_tool
except ImportError:
    ui.print_error(
        "Unable to import abr repo if this isn't a simulation push the abr_testing package"
    )
    from . import google_sheets_tool  # type: ignore[no-redef]

    pass


PROBE_MAX_TIME: Dict[int, float] = {
    1: 2.75,
    8: 1.75,
    96: 0.85,
}


def _load_tipracks(
    ctx: ProtocolContext, pipette_channels: int, protocol_cfg: Any, tip: int
) -> List[Labware]:
    # TODO add logic here for partial tip using 96
    use_adapters: bool = pipette_channels == 96
    tiprack_load_settings: List[Tuple[int, str]] = [
        (
            slot,
            f"opentrons_flex_96_tiprack_{tip}ul",
        )
        for slot in protocol_cfg.SLOTS_TIPRACK[tip]  # type: ignore[attr-defined]
    ]
    for ls in tiprack_load_settings:
        ui.print_info(f'Loading tiprack "{ls[1]}" in slot #{ls[0]}')

    adapter: Optional[str] = (
        "opentrons_flex_96_tiprack_adapter" if use_adapters else None
    )
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = ctx.loaded_labwares
    ui.print_info(f"Loaded labwares {loaded_labwares}")
    pre_loaded_tips: List[Labware] = []
    for ls in tiprack_load_settings:
        if ls[0] in loaded_labwares.keys():
            if loaded_labwares[ls[0]].name == ls[1]:
                pre_loaded_tips.append(loaded_labwares[ls[0]])
            else:
                # If something is in the slot that's not what we want, remove it
                # we use this only for the 96 channel
                ui.print_info(
                    f"Removing {loaded_labwares[ls[0]].name} from slot {ls[0]}"
                )
                ctx._core.move_labware(
                    loaded_labwares[ls[0]]._core,
                    new_location=OffDeckType.OFF_DECK,
                    use_gripper=False,
                    pause_for_manual_move=False,
                    pick_up_offset=None,
                    drop_offset=None,
                )
    if len(pre_loaded_tips) == len(tiprack_load_settings):
        return pre_loaded_tips

    tipracks: List[Labware] = []
    for ls in tiprack_load_settings:
        if ctx.deck[ls[0]] is not None:
            tipracks.append(
                ctx.deck[ls[0]].load_labware(ls[1])  # type: ignore[union-attr]
            )
        else:
            tipracks.append(ctx.load_labware(ls[1], location=ls[0], adapter=adapter))
    return tipracks


def _load_dial_indicator(run_args: RunArgs) -> Labware:
    slot_dial = run_args.protocol_cfg.SLOT_DIAL  # type: ignore[union-attr]
    dial_labware_name = "dial_indicator"
    loaded_labwares = run_args.ctx.loaded_labwares
    if (
        slot_dial in loaded_labwares.keys()
        and loaded_labwares[slot_dial].name == dial_labware_name
    ):
        return loaded_labwares[slot_dial]

    dial_labware = run_args.ctx.load_labware(
        dial_labware_name, location=slot_dial, namespace="custom_beta"
    )
    return dial_labware


def _load_test_well(run_args: RunArgs) -> Labware:
    slot_scale = run_args.protocol_cfg.SLOT_SCALE  # type: ignore[union-attr]
    labware_on_scale = run_args.protocol_cfg.LABWARE_ON_SCALE  # type: ignore[union-attr]
    ui.print_info(f'Loading labware on scale: "{labware_on_scale}"')
    if labware_on_scale == "radwag_pipette_calibration_vial":
        namespace = "custom_beta"
    else:
        namespace = "opentrons"
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = run_args.ctx.loaded_labwares
    if (
        slot_scale in loaded_labwares.keys()
        and loaded_labwares[slot_scale].name == labware_on_scale
    ):
        return loaded_labwares[slot_scale]

    labware_on_scale = run_args.ctx.load_labware(
        labware_on_scale, location=slot_scale, namespace=namespace
    )
    return labware_on_scale


def _load_scale(
    name: str,
    scale: Scale,
    run_id: str,
    pipette_tag: str,
    start_time: float,
    simulating: bool,
) -> GravimetricRecorder:
    ui.print_header("LOAD SCALE")
    ui.print_info(
        "Some Radwag settings cannot be controlled remotely.\n"
        "Listed below are the things the must be done using the touchscreen:\n"
        "  1) Set profile to USER\n"
        "  2) Set screensaver to NONE\n"
    )
    recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=name,
            run_id=run_id,
            tag=pipette_tag,
            start_time=start_time,
            duration=0,
            frequency=1000 if simulating else 60,
            stable=False,
        ),
        scale,
        simulate=simulating,
        start_graph=False,
    )
    ui.print_info(f'found scale "{recorder.serial_number}"')
    if simulating:
        recorder.set_simulation_mass(0)
    recorder.record(in_thread=True)
    ui.print_info(f'scale is recording to "{recorder.file_name}"')
    return recorder


def run(
    tip: int,
    run_args: RunArgs,
    google_sheet: Optional[google_sheets_tool.google_sheet],
    sheet_id: Optional[str],
    starting_tip: str = "A1",
) -> None:
    """Run a liquid probe test."""
    test_labware: Labware = _load_test_well(run_args)
    dial_indicator: Labware = _load_dial_indicator(run_args)
    dial_well: Well = dial_indicator["A1"]
    liquid_height: float = 0.0
    liquid_height_from_deck: float = 0.0
    hw_api = get_sync_hw_api(run_args.ctx)
    test_well: Well = test_labware["A1"]
    _load_tipracks(run_args.ctx, run_args.pipette_channels, run_args.protocol_cfg, tip)
    tips: List[Well] = get_unused_tips(
        ctx=run_args.ctx, tip_volume=tip, pipette_mount=""
    )
    row = "ABCDEFGH".index(starting_tip[0])
    column = int(starting_tip[1:]) - 1
    num_of_tips_to_skip = (column * 8) + row
    del tips[:num_of_tips_to_skip]
    assert len(tips) >= run_args.trials
    results: List[float] = []
    adjusted_results: List[float] = []
    lpc_offset = 0.0
    if run_args.dial_indicator is not None:
        run_args.pipette.move_to(dial_well.top())
        lpc_offset = run_args.dial_indicator.read_stable()
        run_args.pipette._retract()

    def _get_tip_offset() -> float:
        tip_offset = 0.0
        if run_args.dial_indicator is not None:
            run_args.pipette.move_to(dial_well.top())
            tip_offset = run_args.dial_indicator.read_stable()
            run_args.pipette._retract()
        return tip_offset

    def _get_target_height() -> None:
        nonlocal liquid_height, liquid_height_from_deck
        run_args.pipette.pick_up_tip(tips[0])
        del tips[: run_args.pipette_channels]
        liquid_height = _jog_to_find_liquid_height(
            run_args.ctx, run_args.pipette, test_well
        )
        liquid_height_from_deck = test_well.bottom(liquid_height).point.z
        run_args.pipette._retract()

    _get_target_height()
    tip_offset = _get_tip_offset()

    if run_args.return_tip:
        run_args.pipette.return_tip()
    else:
        run_args.pipette.drop_tip()
        run_args.pipette._retract()

    env_data = run_args.environment_sensor.get_reading()

    store_baseline_trial(
        run_args.test_report,
        tip,
        liquid_height_from_deck,
        env_data.relative_humidity,
        env_data.temperature,
        test_well.top().point.z - liquid_height_from_deck,
        tip_offset - lpc_offset,
        google_sheet,
        run_args.run_id,
    )

    trials_before_jog = run_args.trials_before_jog

    try:
        for trial in range(run_args.trials):
            if trial > 0 and trial % trials_before_jog == 0:
                _get_target_height()
                if run_args.return_tip:
                    run_args.pipette.return_tip()
                else:
                    run_args.pipette.drop_tip()
                    run_args.pipette._retract()

            ui.print_info(f"Picking up {tip}ul tip")
            run_args.pipette.pick_up_tip(tips[0])
            del tips[: run_args.pipette_channels]
            # operator defines num of seconds btwn start of the probe movement
            # and meniscus contact calculating ideal starting position is then
            # easy bc no acceleration is involved during probe
            starting_mm_above_liquid = (
                run_args.probe_seconds_before_contact * run_args.z_speed
            )
            starting_mount_height = (
                test_well.bottom(z=liquid_height).point.z + starting_mm_above_liquid
            )
            run_args.pipette.move_to(
                test_well.bottom(z=(liquid_height + starting_mm_above_liquid))
            )
            start_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
            height = _run_trial(run_args, tip, test_well, trial, starting_mount_height)
            end_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
            run_args.pipette.blow_out()
            tip_length_offset = 0.0
            if run_args.dial_indicator is not None:
                run_args.pipette._retract()
                run_args.pipette.move_to(dial_well.top())
                tip_length_offset = tip_offset - run_args.dial_indicator.read_stable()
                run_args.pipette._retract()
                ui.print_info(f"Tip Offset  {tip_length_offset}")

            ui.print_info("Dropping tip")
            if run_args.return_tip:
                run_args.pipette.return_tip()
            else:
                run_args.pipette.drop_tip()
                run_args.pipette._retract()
            results.append(height)
            adjusted_results.append(height + tip_length_offset)
            env_data = run_args.environment_sensor.get_reading()
            hw_pipette = hw_api.hardware_pipettes[top_types.Mount.LEFT]
            plunger_start = (
                hw_pipette.plunger_positions.bottom
                if run_args.aspirate
                else hw_pipette.plunger_positions.top
            )
            store_trial(
                run_args.test_report,
                trial,
                tip,
                height,
                end_pos[Axis.P_L],
                env_data.relative_humidity,
                env_data.temperature,
                start_pos[Axis.Z_L] - height,
                plunger_start - end_pos[Axis.P_L],
                tip_length_offset,
                liquid_height_from_deck,
                google_sheet,
                run_args.run_id,
                sheet_id,
            )
            ui.print_info(
                f"\n\n Z axis start pos {start_pos[Axis.Z_L]} end pos {end_pos[Axis.Z_L]}"
            )
            ui.print_info(
                f"plunger start pos {plunger_start} end pos {end_pos[Axis.P_L]}\n\n"
            )
    finally:
        ui.print_info(f"RESULTS: \n{results}")
        ui.print_info(f"Adjusted RESULTS: \n{adjusted_results}")
        store_tip_results(run_args.test_report, tip, results, adjusted_results)


def get_plunger_travel(run_args: RunArgs) -> float:
    """Get the travel distance for the pipette."""
    hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
    hw_api = get_sync_hw_api(run_args.ctx)
    plunger_positions = hw_api._pipette_handler.get_pipette(hw_mount).plunger_positions
    plunger_travel = plunger_positions.bottom - plunger_positions.top
    return plunger_travel


def find_max_z_distances(
    run_args: RunArgs,
    well: Well,
    p_speed: float,
    starting_mount_height: float,
) -> List[float]:
    """Returns a list of max z distances for each probe.

    Each element is the max travel for the z mount for a particular call
    to hw_api.liquid_probe, it is the limit of z distance the pipette can
    move with the combination of z speed and plunger speed,
    if the distance would exceed the well depth then the number is
    truncated to avoid collisions.
    """
    z_speed = run_args.z_speed
    max_z_distance = starting_mount_height - well.bottom().point.z
    plunger_travel = get_plunger_travel(run_args)
    if p_speed == 0:
        p_travel_time = PROBE_MAX_TIME[run_args.pipette_channels]
    else:
        p_travel_time = min(
            plunger_travel / p_speed, PROBE_MAX_TIME[run_args.pipette_channels]
        )

    z_travels: List[float] = []
    while max_z_distance > 0:
        next_travel = min(p_travel_time * z_speed, max_z_distance)
        z_travels.append(next_travel)
        max_z_distance -= next_travel
    return z_travels


def _run_trial(
    run_args: RunArgs, tip: int, well: Well, trial: int, starting_mount_height: float
) -> float:
    hw_api = get_sync_hw_api(run_args.ctx)
    lqid_cfg: Dict[str, int] = LIQUID_PROBE_SETTINGS[run_args.pipette_volume][
        run_args.pipette_channels
    ][tip]
    data_dir = get_testing_data_directory()
    probes: List[InstrumentProbeType] = [InstrumentProbeType.PRIMARY]
    probe_target: InstrumentProbeType = InstrumentProbeType.PRIMARY
    if run_args.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
        probe_target = InstrumentProbeType.BOTH
    data_files: Dict[InstrumentProbeType, str] = {}
    for probe in probes:
        data_filename = f"pressure_sensor_data-trial{trial}-tip{tip}-{probe.name}.csv"
        data_file = f"{data_dir}/{run_args.name}/{run_args.run_id}/{data_filename}"
        ui.print_info(f"logging pressure data to {data_file}")
        data_files[probe] = data_file

    plunger_speed = (
        lqid_cfg["plunger_speed"]
        if run_args.plunger_speed == -1
        else run_args.plunger_speed
    )

    start_height = starting_mount_height
    height = 2 * start_height
    z_distances: List[float] = find_max_z_distances(
        run_args, well, plunger_speed, starting_mount_height
    )
    z_distances = z_distances[: run_args.multi_passes]
    for z_dist in z_distances:
        lps = LiquidProbeSettings(
            starting_mount_height=start_height,
            mount_speed=run_args.z_speed,
            plunger_speed=plunger_speed,
            sensor_threshold_pascals=lqid_cfg["sensor_threshold_pascals"],
            output_option=OutputOptions.sync_buffer_to_csv,
            aspirate_while_sensing=run_args.aspirate,
            data_files=data_files,
        )

        hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
        run_args.recorder.set_sample_tag(f"trial-{trial}-{tip}ul")
        # TODO add in stuff for secondary probe
        try:
            height = hw_api.liquid_probe(hw_mount, z_dist, lps, probe_target)
        except PipetteLiquidNotFoundError as lnf:
            ui.print_info(f"Liquid not found current position {lnf.detail}")
            start_height -= z_dist
        else:
            break
        run_args.recorder.clear_sample_tag()

    ui.print_info(f"Trial {trial} complete")
    return height
