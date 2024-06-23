import * as React from 'react'
import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import {
  getLoadedLabwareDefinitionsByUri,
  multiple_tipacks_with_tc,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../../redux/config'
import { LabwarePositionCheck } from '../../../../LabwarePositionCheck'
import { useLPCDisabledReason } from '../../../hooks'
import { getLatestCurrentOffsets } from '../utils'
import { CurrentOffsetsTable } from '../CurrentOffsetsTable'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

vi.mock('../../../hooks')
vi.mock('../../../../LabwarePositionCheck')
vi.mock('../../../../../redux/config')
vi.mock('../utils')

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getLoadedLabwareDefinitionsByUri>()
  return {
    ...actual,
    getLoadedLabwareDefinitionsByUri: vi.fn(), // or whatever you want to override the export with
  }
})

const render = (props: React.ComponentProps<typeof CurrentOffsetsTable>) => {
  return renderWithProviders(<CurrentOffsetsTable {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const protocolWithTC = (multiple_tipacks_with_tc as unknown) as CompletedProtocolAnalysis
const mockCurrentOffsets: LabwareOffset[] = [
  {
    createdAt: '2022-12-20T14:06:23.562082+00:00',
    definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
    id: 'dceac542-bca4-4313-82ba-d54a19dab204',
    location: { slotName: '2' },
    vector: { x: 0, y: -0.09999999999999432, z: 0 },
  },
  {
    createdAt: '2022-12-20T14:06:23.562878+00:00',
    definitionUri:
      'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
    id: '70ae2e31-716b-4e1f-a90c-9b0dfd4d7feb',
    location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
    vector: { x: 0, y: 0, z: 0 },
  },
  {
    createdAt: '2022-12-20T14:09:08.689813+00:00',
    definitionUri:
      'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
    id: 'd39b972e-9b2d-436c-a597-3bc81aabc634',
    location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
    vector: { x: -0.10000000000000142, y: 0, z: 0 },
  },
]

describe('CurrentOffsetsTable', () => {
  let props: React.ComponentProps<typeof CurrentOffsetsTable>
  beforeEach(() => {
    props = {
      currentOffsets: mockCurrentOffsets,
      commands: protocolWithTC.commands,
      labware: [
        {
          id: 'mockId',
          displayName: 'Opentrons 96 Tip Rack 300 µL',
          loadName: 'fakeLoadName',
          definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
          location: 'offDeck',
        },
      ],
      modules: [
        {
          id: 'mockModId',
          model: 'thermocyclerModuleV1',

          location: { slotName: '1' },
          serialNumber: 'fakeserial',
        },
      ],
    }
    vi.mocked(useLPCDisabledReason).mockReturnValue(null)
    vi.mocked(getLoadedLabwareDefinitionsByUri).mockReturnValue({
      fixedTrash: {
        displayName: 'Trash',
        definitionId: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      },
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1': {
        displayName: 'Opentrons 96 Tip Rack 300 µL',
        definitionId: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1': {
        displayName: 'NEST 12 Well Reservoir 15 mL',
        definitionId: 'opentrons/nest_12_reservoir_15ml/1',
      },
      'e24818a0-0042-11ec-8258-f7ffdf5ad45a': {
        displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
        definitionId: 'opentrons/opentrons_96_tiprack_300ul/1',
      },
      '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        definitionId: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      },
    } as any)
    vi.mocked(LabwarePositionCheck).mockReturnValue(
      <div>mock labware position check</div>
    )
    vi.mocked(getIsLabwareOffsetCodeSnippetsOn).mockReturnValue(false)
    vi.mocked(getLatestCurrentOffsets).mockReturnValue([
      {
        createdAt: '2022-12-20T14:06:23.562082+00:00',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        id: 'dceac542-bca4-4313-82ba-d54a19dab204',
        location: { slotName: '2' },
        vector: { x: 0, y: -0.09999999999999432, z: 0 },
      },
    ])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the correct text', () => {
    render(props)
    screen.getByText('APPLIED LABWARE OFFSET DATA')
    screen.getByText('location')
    screen.getByText('labware')
    screen.getByText('labware offset data')
  })

  it('renders 1 offset with the correct information', () => {
    render(props)
    screen.getByText('opentrons/opentrons_96_tiprack_10ul/1')
    screen.getByText('Slot 2')
  })

  it('renders tabbed offset data with snippets when config option is selected', () => {
    vi.mocked(getIsLabwareOffsetCodeSnippetsOn).mockReturnValue(true)
    render(props)
    expect(screen.getByText('Table View')).toBeTruthy()
    expect(screen.getByText('Jupyter Notebook')).toBeTruthy()
    expect(screen.getByText('Command Line Interface (SSH)')).toBeTruthy()
  })
})
