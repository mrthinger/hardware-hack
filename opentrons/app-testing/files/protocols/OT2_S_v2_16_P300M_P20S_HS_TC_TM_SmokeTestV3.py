"""Smoke Test v3.0 """

# https://opentrons.atlassian.net/projects/RQA?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page#!/testCase/QB-T497
from opentrons import protocol_api

metadata = {
    "protocolName": "🛠️ 2.16 Smoke Test V3 🪄",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("Description of the protocol that is longish \n has \n returns and \n emoji 😊 ⬆️ "),
}

requirements = {"robotType": "OT-2", "apiLevel": "2.16"}

#############
# CHANGELOG #
#############

# ----
# 2.16
# ----

# - prepare_to_aspirate added
# - fixed_trash property changed
# - instrument_context.trash_container property changed

# ----
# 2.15
# ----

# - move_labware added - Manual Deck State Modification
# - ProtocolContext.load_adapter added
# - OFF_DECK location added

# ----
# 2.14
# ----

# - ProtocolContext.defined_liquid and Well.load_liquid added
# - load_labware without parameters should still find the labware

# ----
# 2.13
# ----

# - Heater-Shaker Module support added


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    ctx.set_rail_lights(True)
    ctx.comment(f"Let there be light! {ctx.rail_lights_on} 🌠🌠🌠")
    ctx.comment(f"Is the door is closed? {ctx.door_closed} 🚪🚪🚪")
    ctx.comment(f"Is this a simulation? {ctx.is_simulating()} 🔮🔮🔮")
    ctx.comment(f"Running against API Version: {ctx.api_version}")

    # deck positions
    tips_300ul_position = "5"
    tips_20ul_position = "4"
    dye_source_position = "3"
    logo_position = "2"
    temperature_position = "9"
    custom_lw_position = "6"
    hs_position = "1"

    # Thermocycler has a default position that covers Slots 7, 8, 10, and 11.
    # This is the only valid location for the Thermocycler on the OT-2 deck.
    # This position is a default parameter when declaring the TC so you do not need to specify.

    # 300ul tips
    tips_300ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location=tips_300ul_position,
            label="300ul tips",
        )
    ]

    # 20ul tips
    tips_20ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_20ul",
            location=tips_20ul_position,
            label="20ul tips",
        )
    ]

    # pipettes
    pipette_left = ctx.load_instrument(instrument_name="p300_multi_gen2", mount="left", tip_racks=tips_300ul)

    pipette_right = ctx.load_instrument(instrument_name="p20_single_gen2", mount="right", tip_racks=tips_20ul)

    #########################
    # Heater-Shaker Support #
    #########################

    # -------------------------- #
    # Added in API version: 2.13 #
    # -------------------------- #

    # modules https://docs.opentrons.com/v2/new_modules.html#available-modules
    hs_module = ctx.load_module("heaterShakerModuleV1", hs_position)
    temperature_module = ctx.load_module("temperature module gen2", temperature_position)
    thermocycler_module = ctx.load_module("thermocycler module gen2")

    # module labware
    temp_adapter = temperature_module.load_adapter("opentrons_96_well_aluminum_block")
    temp_plate = temp_adapter.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        label="Temperature-Controlled plate",
    )
    hs_plate = hs_module.load_labware(name="nest_96_wellplate_100ul_pcr_full_skirt", adapter="opentrons_96_pcr_adapter")
    tc_plate = thermocycler_module.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    ###################################
    # Load Labware with no parameters #
    ###################################

    # -------------------------- #
    # Fixed in API version: 2.14 #
    # -------------------------- #

    custom_labware = ctx.load_labware(
        "cpx_4_tuberack_100ul",
        custom_lw_position,
        label="4 custom tubes",
    )

    # create plates and pattern list
    logo_destination_plate = ctx.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        location=logo_position,
        label="logo destination",
    )

    dye_container = ctx.load_labware(
        load_name="nest_12_reservoir_15ml",
        location=dye_source_position,
        label="dye container",
    )

    dye_source = dye_container.wells_by_name()["A2"]

    # Well Location set-up
    dye_destination_wells = [
        logo_destination_plate.wells_by_name()["C7"],
        logo_destination_plate.wells_by_name()["D6"],
        logo_destination_plate.wells_by_name()["D7"],
        logo_destination_plate.wells_by_name()["D8"],
        logo_destination_plate.wells_by_name()["E5"],
    ]

    #######################################
    # define_liquid & load_liquid Support #
    #######################################

    # -------------------------- #
    # Added in API version: 2.14 #
    # -------------------------- #

    water = ctx.define_liquid(
        name="water", description="H₂O", display_color="#42AB2D"
    )  # subscript 2 https://www.compart.com/en/unicode/U+2082

    acetone = ctx.define_liquid(
        name="acetone", description="C₃H₆O", display_color="#38588a"
    )  # subscript 3 https://www.compart.com/en/unicode/U+2083
    # subscript 6 https://www.compart.com/en/unicode/U+2086

    dye_container.wells_by_name()["A1"].load_liquid(liquid=water, volume=4000)
    dye_container.wells_by_name()["A2"].load_liquid(liquid=water, volume=2000)
    dye_container.wells_by_name()["A5"].load_liquid(liquid=acetone, volume=555.55555)

    # 2 different liquids in the same well
    dye_container.wells_by_name()["A8"].load_liquid(liquid=water, volume=900.00)
    dye_container.wells_by_name()["A8"].load_liquid(liquid=acetone, volume=1001.11)

    hs_module.close_labware_latch()

    pipette_right.pick_up_tip()

    ##################################
    # Manual Deck State Modification #
    ##################################

    # -------------------------- #
    # Added in API version: 2.15 #
    # -------------------------- #

    # Putting steps for this at beginning of protocol so you can do the manual stuff
    # then walk away to let the rest of the protocol execute

    # The test flow is as follows:
    #   1. Remove the existing PCR plate from slot 2
    #   2. Move the reservoir from slot 3 to slot 2
    #   3. Pickup P20 tip, move pipette to reservoir A1 in slot 2
    #   4. Pause and ask user to validate that the tip is in the middle of reservoir A1 in slot 2
    #   5. Move the reservoir back to slot 3 from slot 2
    #   6. Move pipette to reservoir A1 in slot 3
    #   7. Pause and ask user to validate that the tip is in the middle of reservoir A1 in slot 3
    #   8. Move custom labware from slot 6 to slot 2
    #   9. Move pipette to well A1 in slot 2
    #   10. Pause and ask user to validate that the tip is in the middle of well A1 in slot 2
    #   11. Move the custom labware back to slot 6 from slot 2
    #   12. Move pipette to well A1 in slot 6
    #   13. Pause and ask user to validate that the tip is in the middle of well A1 in slot 6
    #   14. Move the offdeck PCR plate back to slot 2
    #   15. Move pipette to well A1 in slot 2
    #   16. Pause and ask user to validate that the tip is in the middle of well A1 in slot 2

    # In effect, nothing will actually change to the protocol,
    # but we will be able to test that the UI responds appropriately.

    # Note:
    #   logo_destination_plate is a nest_96_wellplate_100ul_pcr_full_skirt - starting position is slot 2
    #   dye_container is a nest_12_reservoir_15ml - starting position is slot 3

    # Step 1
    ctx.move_labware(
        labware=logo_destination_plate,
        new_location=protocol_api.OFF_DECK,
    )

    # Step 2
    ctx.move_labware(labware=dye_container, new_location="2")

    # Step 3
    pipette_right.move_to(location=dye_container.wells_by_name()["A1"].top())

    # Step 4
    ctx.pause("Is the pipette tip in the middle of reservoir A1 in slot 2?")

    # Step 5
    ctx.move_labware(labware=dye_container, new_location="3")

    # Step 6
    pipette_right.move_to(location=dye_container.wells_by_name()["A1"].top())

    # Step 7
    ctx.pause("Is the pipette tip in the middle of reservoir A1 in slot 3?")

    # Step 8
    ctx.move_labware(labware=custom_labware, new_location="2")

    # Step 9
    pipette_right.move_to(location=custom_labware.wells_by_name()["A1"].top())

    # Step 10
    ctx.pause("Is the pipette tip in the middle of custom labware A1 in slot 2?")

    # Step 11
    ctx.move_labware(labware=custom_labware, new_location="6")

    # Step 12
    pipette_right.move_to(location=custom_labware.wells_by_name()["A1"].top())

    # Step 13
    ctx.pause("Is the pipette tip in the middle of custom labware A1 in slot 6?")

    # Step 14
    ctx.move_labware(labware=logo_destination_plate, new_location="2")

    # Step 15
    pipette_right.move_to(location=logo_destination_plate.wells_by_name()["A1"].top())

    # Step 16
    ctx.pause("Is the pipette tip in the middle of well A1 in slot 2?")

    #######################
    # prepare_to_aspirate #
    #######################

    # -------------------------- #
    # Added in API version: 2.16 #
    # -------------------------- #

    pipette_right.prepare_to_aspirate()
    pipette_right.move_to(dye_container.wells_by_name()["A1"].bottom(z=2))
    ctx.pause(
        "Testing prepare_to_aspirate - watch pipette until next pause.\n The pipette should only move up out of the well after it has aspirated."
    )
    pipette_right.aspirate(10, dye_container.wells_by_name()["A1"].bottom(z=2))
    ctx.pause("Did the pipette move up out of the well, only once, after aspirating?")
    pipette_right.dispense(10, dye_container.wells_by_name()["A1"].bottom(z=2))

    #########################################
    # protocol_context.fixed_trash property #
    #########################################

    # ---------------------------- #
    # Changed in API version: 2.16 #
    # ---------------------------- #

    pipette_right.move_to(ctx.fixed_trash)
    ctx.pause("Is the pipette over the trash? Pipette will home after this pause.")
    ctx.home()

    ###############################################
    # instrument_context.trash_container property #
    ###############################################

    # ---------------------------- #
    # Changed in API version: 2.16 #
    # ---------------------------- #

    pipette_right.move_to(pipette_right.trash_container)
    ctx.pause("Is the pipette over the trash?")

    # Distribute dye
    pipette_right.distribute(
        volume=18,
        source=dye_source,
        dest=dye_destination_wells,
        new_tip="never",
    )
    pipette_right.drop_tip()

    # transfer
    transfer_destinations = [
        logo_destination_plate.wells_by_name()["A11"],
        logo_destination_plate.wells_by_name()["B11"],
        logo_destination_plate.wells_by_name()["C11"],
    ]
    pipette_right.pick_up_tip()
    pipette_right.transfer(
        volume=60,
        source=dye_container.wells_by_name()["A2"],
        dest=transfer_destinations,
        new_tip="never",
        touch_tip=True,
        blow_out=True,
        blowout_location="destination well",
        mix_before=(3, 20),
        mix_after=(1, 20),
        mix_touch_tip=True,
    )

    # consolidate
    pipette_right.consolidate(
        volume=20,
        source=transfer_destinations,
        dest=dye_container.wells_by_name()["A5"],
        new_tip="never",
        touch_tip=False,
        blow_out=True,
        blowout_location="destination well",
        mix_before=(3, 20),
    )

    # well to well
    pipette_right.return_tip()
    pipette_right.pick_up_tip()
    pipette_right.aspirate(volume=5, location=logo_destination_plate.wells_by_name()["A11"])
    pipette_right.air_gap(volume=10)
    ctx.delay(seconds=3)
    pipette_right.dispense(volume=5, location=logo_destination_plate.wells_by_name()["H11"])

    # move to
    pipette_right.move_to(logo_destination_plate.wells_by_name()["E12"].top())
    pipette_right.move_to(logo_destination_plate.wells_by_name()["E11"].bottom())
    pipette_right.blow_out()
    # touch tip
    # pipette ends in the middle of the well as of 6.3.0 in all touch_tip
    pipette_right.touch_tip(location=logo_destination_plate.wells_by_name()["H1"])
    ctx.pause("Is the pipette tip in the middle of the well?")
    pipette_right.return_tip()

    # Play with the modules
    temperature_module.await_temperature(25)

    hs_module.set_and_wait_for_shake_speed(466)
    ctx.delay(seconds=5)

    hs_module.set_and_wait_for_temperature(38)

    thermocycler_module.open_lid()
    thermocycler_module.close_lid()
    thermocycler_module.set_lid_temperature(38)  # 37 is the minimum
    thermocycler_module.set_block_temperature(temperature=28, hold_time_seconds=5)
    thermocycler_module.deactivate_block()
    thermocycler_module.deactivate_lid()
    thermocycler_module.open_lid()

    hs_module.deactivate_shaker()

    # dispense to modules

    # to temperature module
    pipette_right.pick_up_tip()
    pipette_right.aspirate(volume=15, location=dye_source)
    pipette_right.dispense(volume=15, location=temp_plate.well(0))
    pipette_right.drop_tip()

    # to heater shaker
    pipette_left.pick_up_tip()
    pipette_left.aspirate(volume=50, location=dye_source)
    pipette_left.dispense(volume=50, location=hs_plate.well(0))
    hs_module.set_and_wait_for_shake_speed(350)
    ctx.delay(seconds=5)
    hs_module.deactivate_shaker()

    # to custom labware
    # This labware does not EXIST!!!! so...
    # Use tip rack lid to catch dye on wet run
    pipette_right.pick_up_tip()
    pipette_right.aspirate(volume=10, location=dye_source, rate=2.0)
    pipette_right.dispense(volume=10, location=custom_labware.well(3), rate=1.5)
    pipette_right.drop_tip()

    # to thermocycler
    pipette_left.aspirate(volume=75, location=dye_source)
    pipette_left.dispense(volume=60, location=tc_plate.wells_by_name()["A6"])
    pipette_left.drop_tip()
