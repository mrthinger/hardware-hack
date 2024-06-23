import { describe, it, expect } from 'vitest'

import { transfer_settings, ot2DeckDefV5 } from '@opentrons/shared-data'
import { getLabwareRenderInfo } from '../getLabwareRenderInfo'
import type {
  CompletedProtocolAnalysis,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'

const protocolWithMagTempTC = (transfer_settings as unknown) as CompletedProtocolAnalysis
const standardDeckDef = ot2DeckDefV5 as any

describe('getLabwareRenderInfo', () => {
  it('should gather labware coordinates', () => {
    // these are just taken from the ot-2 deck def for readability
    const SLOT_2_COORDS = [132.5, 0.0, 0.0]
    const SLOT_4_COORDS = [0.0, 90.5, 0.0]
    const SLOT_5_COORDS = [132.5, 90.5, 0.0]
    const SLOT_6_COORDS = [265.0, 90.5, 0.0]
    const SLOT_9_COORDS = [265.0, 181.0, 0.0]
    const SLOT_10_COORDS = [0.0, 271.5, 0.0]

    // labware ids come from the fixture protocol, they are just here for readability
    const OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID =
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1'
    const NEST_1_RESEVOIR_195ML_ID =
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1'
    const CORNING_24_WELLPLATE_1_ID = '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b'
    const CORNING_24_WELLPLATE_2_ID =
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
    const OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID =
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1'
    const labeledLabwareDisplayName = 'customLabwareDisplayName'
    const loadLabwareCommandWithDisplayName: LoadLabwareRunTimeCommand = {
      commandType: 'loadLabware',
      params: {
        labwareId: 'abc123',
        location: { slotName: '10' },
        displayName: labeledLabwareDisplayName,
      },
      result: {
        labwareId: 'abc123',
        definition: { namespace: 'fake_namespace' } as any,
        offset: { x: 0, y: 0, z: 0 },
      },
    } as any
    const expected = {
      // slot 1 has mag mod
      // slot 2
      [OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID]: {
        labwareDef: expect.anything(),
        displayName: null,
        x: SLOT_2_COORDS[0],
        y: SLOT_2_COORDS[1],
        z: SLOT_2_COORDS[2],
        slotName: '2',
      },
      // slot 3 has temp mod
      // slot 4
      [NEST_1_RESEVOIR_195ML_ID]: {
        labwareDef: expect.anything(),
        displayName: null,
        x: SLOT_4_COORDS[0],
        y: SLOT_4_COORDS[1],
        z: SLOT_4_COORDS[2],
        slotName: '4',
      },
      // slot 5
      [CORNING_24_WELLPLATE_2_ID]: {
        labwareDef: expect.anything(),
        displayName: null,
        x: SLOT_5_COORDS[0],
        y: SLOT_5_COORDS[1],
        z: SLOT_5_COORDS[2],
        slotName: '5',
      },
      // slot 6
      [CORNING_24_WELLPLATE_1_ID]: {
        labwareDef: expect.anything(),
        displayName: null,
        x: SLOT_6_COORDS[0],
        y: SLOT_6_COORDS[1],
        z: SLOT_6_COORDS[2],
        slotName: '6',
      },
      // slot 7 has TC
      // slot 9
      [OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID]: {
        labwareDef: expect.anything(),
        displayName: null,
        x: SLOT_9_COORDS[0],
        y: SLOT_9_COORDS[1],
        z: SLOT_9_COORDS[2],
        slotName: '9',
      },
      // slot 10
      abc123: {
        labwareDef: expect.anything(),
        displayName: labeledLabwareDisplayName,
        x: SLOT_10_COORDS[0],
        y: SLOT_10_COORDS[1],
        z: SLOT_10_COORDS[2],
        slotName: '10',
      },
    }

    expect(
      getLabwareRenderInfo(
        {
          ...protocolWithMagTempTC,
          commands: [
            ...protocolWithMagTempTC.commands,
            loadLabwareCommandWithDisplayName,
          ],
        },
        standardDeckDef
      )
    ).toEqual(expected)
  })
})
