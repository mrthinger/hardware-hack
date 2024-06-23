from opentrons import protocol_api

metadata = {
    "protocolName": "Serial Dilution Tutorial – Flex 1-channel",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "author": "New API User"
    }
    
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16"
    }

def run(protocol: protocol_api.ProtocolContext):
    tips = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D3")
    trash = protocol.load_trash_bin("A3")
    left_pipette = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tips])

    # distribute diluent
    left_pipette.transfer(100, reservoir["A1"], plate.wells())

    # loop through each row
    for i in range(8):

        # save the destination row to a variable
        row = plate.rows()[i]

        # transfer solution to first well in column
        left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

        # dilute the sample down the row
        left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))