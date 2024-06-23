import { renderHook } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'

import {
  getPipetteNameSpecs,
  getLoadedLabwareDefinitionsByUri,
  opentrons96Tiprack10UlV1Uncasted as _tiprack10ul,
} from '@opentrons/shared-data'
import { useAllTipLengthCalibrationsQuery } from '@opentrons/react-api-client'

import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../../redux/pipettes/__fixtures__'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  useAttachedPipetteCalibrations,
  useAttachedPipettes,
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
} from '..'
import _uncastedModifiedSimpleV6Protocol from '../__fixtures__/modifiedSimpleV6.json'

import type * as SharedData from '@opentrons/shared-data'
import type { PipetteInfo } from '..'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actualSharedData = await importOriginal<typeof SharedData>()
  return {
    ...actualSharedData,
    getPipetteNameSpecs: vi.fn(),
    getLoadedLabwareDefinitionsByUri: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../useAttachedPipetteCalibrations')
vi.mock('../useAttachedPipettes')
vi.mock('../useTipLengthCalibrations')
vi.mock('../useStoredProtocolAnalysis')

const PIPETTE_CALIBRATIONS = {
  left: {
    offset: mockPipetteOffsetCalibration1,
    tipLength: mockTipLengthCalibration1,
  },
  right: {
    offset: mockPipetteOffsetCalibration2,
    tipLength: mockTipLengthCalibration2,
  },
}

const ATTACHED_PIPETTES = {
  left: mockLeftProtoPipette,
  right: mockRightProtoPipette,
}

const TIP_LENGTH_CALIBRATIONS = [
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
]

const tiprack10ul = _tiprack10ul as SharedData.LabwareDefinition2
const modifiedSimpleV6Protocol = ({
  ..._uncastedModifiedSimpleV6Protocol,
  labware: [
    {
      id: ' trashId',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      loadName: 'opentrons_1_trash_1100ml_fixed',
    },
    {
      id: 'tipRackId',
      displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      loadName: 'opentrons_96_tiprack_10ul',
    },
    {
      id: 'sourcePlateId',
      displayName: 'Source Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
    {
      id: 'destPlateId',
      displayName: 'Sample Collection Plate',
      definitionUri: 'example/plate/1',
      loadName: 'plate',
    },
  ],
  pipettes: [
    {
      id: 'pipetteId',
      pipetteName: 'p10_single',
    },
  ],
} as any) as SharedData.ProtocolAnalysisOutput

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: modifiedSimpleV6Protocol,
  protocolKey: 'fakeProtocolKey',
  robotType: 'OT-2 Standard' as const,
}

describe('useRunPipetteInfoByMount hook', () => {
  beforeEach(() => {
    when(vi.mocked(useAttachedPipetteCalibrations))
      .calledWith()
      .thenReturn(PIPETTE_CALIBRATIONS)
    when(vi.mocked(useAttachedPipettes))
      .calledWith()
      .thenReturn(ATTACHED_PIPETTES)
    when(vi.mocked(useAllTipLengthCalibrationsQuery))
      .calledWith()
      .thenReturn({ data: { data: TIP_LENGTH_CALIBRATIONS } } as any)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(PROTOCOL_DETAILS.protocolData as any)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith('1')
      .thenReturn(
        (PROTOCOL_DETAILS as unknown) as SharedData.ProtocolAnalysisOutput
      )
    when(vi.mocked(getPipetteNameSpecs))
      .calledWith('p10_single')
      .thenReturn({
        displayName: 'P10 Single-Channel GEN1',
      } as SharedData.PipetteNameSpecs)
    when(vi.mocked(getLoadedLabwareDefinitionsByUri))
      .calledWith(
        _uncastedModifiedSimpleV6Protocol.commands as SharedData.RunTimeCommand[]
      )
      .thenReturn(_uncastedModifiedSimpleV6Protocol.labwareDefinitions as {})
  })

  it('should return empty mounts when protocol details not found', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith('1')
      .thenReturn(null)
    when(vi.mocked(useStoredProtocolAnalysis)).calledWith('1').thenReturn(null)
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: null,
      right: null,
    })
  })

  it('should return run pipette info by mount', () => {
    const { result } = renderHook(() => useRunPipetteInfoByMount('1'))
    expect(result.current).toStrictEqual({
      left: ({
        id: 'pipetteId',
        pipetteName: 'p10_single',
        requestedPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteSpecs: {
          displayName: 'P10 Single-Channel GEN1',
        },
        tipRacksForPipette: [
          {
            displayName: 'Opentrons OT-2 96 Tip Rack 10 µL',
            lastModifiedDate: null,
            tipRackDef: tiprack10ul,
          },
        ],
      } as unknown) as PipetteInfo,
      right: null,
    })
  })
})
