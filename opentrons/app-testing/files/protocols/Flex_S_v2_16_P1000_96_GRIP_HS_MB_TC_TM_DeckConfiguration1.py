from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Deck Configuration 1",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

HEATER_SHAKER_NAME = "heaterShakerModuleV1"
MAGNETIC_BLOCK_NAME = "magneticBlockV1"
PCR_PLATE_96_NAME = "nest_96_wellplate_100ul_pcr_full_skirt"
STARTING_VOL = 100
TEMPERATURE_MODULE_NAME = "temperature module gen2"
THERMOCYCLER_NAME = "thermocycler module gen2"
TIPRACK_96_NAME = "opentrons_flex_96_tiprack_1000ul"
TRANSFER_VOL = 10
USING_GRIPPER = True

TIP_RACK_LOCATION_1 = "C3"
TIP_RACK_LOCATION_2 = "D2"


def default_well(tiprack: protocol_api.labware) -> protocol_api.labware.Well:
    return tiprack["A1"]


def run(ctx: protocol_api.ProtocolContext) -> None:
    ################
    ### FIXTURES ###
    ################

    trash_bin_1 = ctx.load_trash_bin("C1")
    trash_bin_2 = ctx.load_trash_bin("D1")
    waste_chute = ctx.load_waste_chute()

    ###############
    ### MODULES ###
    ###############
    thermocycler = ctx.load_module(THERMOCYCLER_NAME)  # A1 & B1
    magnetic_block = ctx.load_module(MAGNETIC_BLOCK_NAME, "A2")
    # heater_shaker = ctx.load_module(HEATER_SHAKER_NAME, "A3")
    temperature_module = ctx.load_module(TEMPERATURE_MODULE_NAME, "B3")

    #######################
    ### MODULE ADAPTERS ###
    #######################

    temperature_module_adapter = temperature_module.load_adapter("opentrons_96_well_aluminum_block")
    # heater_shaker_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    ###############
    ### LABWARE ###
    ###############

    src_pcr_plate = ctx.load_labware(PCR_PLATE_96_NAME, "B2")
    dest_pcr_plate = ctx.load_labware(PCR_PLATE_96_NAME, "C2")

    on_deck_tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, TIP_RACK_LOCATION_1, adapter="opentrons_flex_96_tiprack_adapter")
    tip_rack_adapter_1 = on_deck_tip_rack_1.parent

    on_deck_tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, TIP_RACK_LOCATION_2, adapter="opentrons_flex_96_tiprack_adapter")
    tip_rack_adapter_2 = on_deck_tip_rack_2.parent

    off_deck_tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)
    off_deck_tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)

    staging_area_tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, "C4")
    staging_area_tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, "D4")

    tip_racks = [
        on_deck_tip_rack_1,
        on_deck_tip_rack_2,
        staging_area_tip_rack_1,
        staging_area_tip_rack_2,
        off_deck_tip_rack_1,
        off_deck_tip_rack_2,
    ]

    ##########################
    ### PIPETTE DEFINITION ###
    ##########################

    pipette_96_channel = ctx.load_instrument("flex_96channel_1000", mount="left", tip_racks=tip_racks)

    ########################
    ### LOAD SOME LIQUID ###
    ########################

    water = ctx.define_liquid(name="water", description="High Quality H₂O", display_color="#42AB2D")

    acetone = ctx.define_liquid(name="acetone", description="C₃H₆O", display_color="#38588a")

    [
        well.load_liquid(liquid=water if i % 2 == 0 else acetone, volume=STARTING_VOL)
        for i, column in enumerate(src_pcr_plate.columns())
        for well in column
    ]

    ########################
    ### MOVE SOME LIQUID ###
    ########################

    pipette_96_channel.pick_up_tip(default_well(on_deck_tip_rack_1))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(on_deck_tip_rack_2))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(trash_bin_1)

    ##################################
    ### THROW AWAY EMPTY TIP RACKS ###
    ##################################

    ctx.move_labware(on_deck_tip_rack_1, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(on_deck_tip_rack_2, waste_chute, use_gripper=USING_GRIPPER)

    ###################################
    ### MOVE STAGING AREA TIP RACKS ###
    ###################################

    ctx.move_labware(staging_area_tip_rack_1, tip_rack_adapter_1, use_gripper=USING_GRIPPER)
    ctx.move_labware(staging_area_tip_rack_2, tip_rack_adapter_2, use_gripper=USING_GRIPPER)

    #############################
    ### MOVE SOME MORE LIQUID ###
    #############################

    pipette_96_channel.pick_up_tip(default_well(staging_area_tip_rack_1))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(staging_area_tip_rack_2))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(trash_bin_2)

    ##################################
    ### THROW AWAY EMPTY TIP RACKS ###
    ##################################

    ctx.move_labware(staging_area_tip_rack_1, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(staging_area_tip_rack_2, waste_chute, use_gripper=USING_GRIPPER)

    ###############################
    ### MOVE OFF DECK TIP RACKS ###
    ###############################

    ctx.move_labware(off_deck_tip_rack_1, tip_rack_adapter_1, use_gripper=not USING_GRIPPER)
    ctx.move_labware(off_deck_tip_rack_2, tip_rack_adapter_2, use_gripper=not USING_GRIPPER)

    pipette_96_channel.pick_up_tip(default_well(off_deck_tip_rack_1))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(off_deck_tip_rack_2))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(src_pcr_plate), default_well(dest_pcr_plate), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    ############################
    ### PUT STUFF ON MODULES ###
    ############################

    thermocycler.open_lid()
    ctx.move_labware(dest_pcr_plate, thermocycler, use_gripper=USING_GRIPPER)
    ctx.move_labware(dest_pcr_plate, magnetic_block, use_gripper=USING_GRIPPER)
    # ctx.move_labware(dest_pcr_plate, heater_shaker_adapter, use_gripper=USING_GRIPPER)
    ctx.move_labware(dest_pcr_plate, temperature_module_adapter, use_gripper=USING_GRIPPER)

    ##########################################
    ### MAKE THIS PROTOCOL TOTALLY USELESS ###
    ##########################################

    ctx.move_labware(src_pcr_plate, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(dest_pcr_plate, waste_chute, use_gripper=USING_GRIPPER)
