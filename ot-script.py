from opentrons import protocol_api

metadata = {
}

requirements = {"robotType": "Flex", "apiLevel": "2.15"}

def run(protocol: protocol_api.ProtocolContext):
    # Load labware
    plate = protocol.load_labware('nest_96_wellplate_100ul_pcr_full_skirt', 'C1')
    tuberack = protocol.load_labware('opentrons_15_tuberack_falcon_15ml_conical', 'D2')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C2')

    # Load pipette
    pipette = protocol.load_instrument('flex_1channel_50', 'right', tip_racks=[tiprack])

    pipette.flow_rate.aspirate = 10
    pipette.flow_rate.dispense = 10
    # Define source solutions
    glycerol = tuberack['A1']
    water = tuberack['A2']

    # Create concentration gradient
    for row in plate.rows():
        for well in row:
            glycerol_vol = 45 * (1 - int(well.well_name[1:]) / 12)  # 0-100% across columns
            water_vol = 45 - glycerol_vol

            pipette.pick_up_tip()
            pipette.transfer(glycerol_vol, glycerol, well, new_tip='never')
            pipette.transfer(water_vol, water, well, mix_after=(3,45),new_tip='never')
            pipette.blow_out(well)
            pipette.drop_tip()
        break

    protocol.comment("Gradient complete. Please check the plate.")