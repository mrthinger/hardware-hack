import * as React from 'react'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { InfoScreen } from '@opentrons/components'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useNotifyRunQuery } from '../../../../resources/runs'
import { useFeatureFlag } from '../../../../redux/config'
import { mockSucceededRun } from '../../../RunTimeControl/__fixtures__'
import { ProtocolRunRuntimeParameters } from '../ProtocolRunRunTimeParameters'
import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  RunTimeParameter,
} from '@opentrons/shared-data'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof InfoScreen>()
  return {
    ...actual,
    InfoScreen: vi.fn(),
  }
})
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../RunTimeControl/hooks')
vi.mock('../../../../resources/runs')
vi.mock('../../../../redux/config')

const RUN_ID = 'mockId'

const mockRunTimeParameterData: RunTimeParameter[] = [
  {
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'Is this a dry or wet run? Wet is true, dry is false',
    type: 'bool',
    default: false,
    value: false,
  },
  {
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: 'How many columns do you want?',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
    value: 4,
  },
  {
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '70% ethanol volume',
    type: 'float',
    suffix: 'mL',
    min: 1.5,
    max: 10.0,
    default: 6.5,
    value: 6.5,
  },
  {
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: 'default module offsets for temp, H-S, and none',
    type: 'str',
    value: 'none',
    choices: [
      {
        displayName: 'No offsets',
        value: 'none',
      },
      {
        displayName: 'temp offset',
        value: '1',
      },
      {
        displayName: 'heater-shaker offset',
        value: '2',
      },
    ],
    default: 'none',
  },
]

const mockCsvRtp = {
  displayName: 'CSV File',
  variableName: 'csv_file_var',
  description: '',
  type: 'csv_file',
  file: {
    file: { name: 'mock.csv' } as File,
  },
}

const render = (
  props: React.ComponentProps<typeof ProtocolRunRuntimeParameters>
) => {
  return renderWithProviders(<ProtocolRunRuntimeParameters {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolRunRuntimeParameters', () => {
  let props: React.ComponentProps<typeof ProtocolRunRuntimeParameters>
  beforeEach(() => {
    props = {
      runId: RUN_ID,
    }
    vi.mocked(InfoScreen).mockReturnValue(<div>mock InfoScreen</div>)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        runTimeParameters: mockRunTimeParameterData,
      } as CompletedProtocolAnalysis)
    vi.mocked(useRunStatus).mockReturnValue('running')
    vi.mocked(useNotifyRunQuery).mockReturnValue(({
      data: { data: mockSucceededRun },
    } as unknown) as UseQueryResult<Run>)
    when(vi.mocked(useFeatureFlag))
      .calledWith('enableCsvFile')
      .thenReturn(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render title, and banner when RunTimeParameters are not empty and all values are default', () => {
    render(props)
    screen.getByText('Parameters')
    screen.getByText('Default values')
    screen.getByText('Values are view-only')
    screen.getByText('Cancel the run and restart setup to edit')
    screen.getByText('Name')
    screen.getByText('Value')
  })

  it('should render title, and banner when RunTimeParameters are not empty and some value is changed', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
      runTimeParameters: [
        ...mockRunTimeParameterData,
        {
          displayName: 'Dry Run',
          variableName: 'DRYRUN',
          description: 'Is this a dry or wet run? Wet is true, dry is false',
          type: 'bool',
          default: false,
          value: true,
        },
      ],
    } as CompletedProtocolAnalysis)
    render(props)
    screen.getByText('Parameters')
    screen.getByText('Custom values')
    screen.getByText('Values are view-only')
    screen.getByText('Cancel the run and restart setup to edit')
    screen.getByText('Name')
    screen.getByText('Value')
  })

  it('should render RunTimeParameters when RunTimeParameters are not empty', () => {
    render(props)
    screen.getByText('Dry Run')
    screen.getByText('Off')
    screen.getByText('Columns of Samples')
    screen.getByText('4')
    screen.getByText('EtoH Volume')
    screen.getByText('6.5 mL')
    screen.getByText('Default Module Offsets')
    screen.getByText('No offsets')
  })

  it('should render mock InfoScreen component when RunTimeParameters are empty', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        runTimeParameters: [] as RunTimeParameter[],
      } as CompletedProtocolAnalysis)
    render(props)
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument()
    expect(screen.queryByText('Default values')).not.toBeInTheDocument()
    screen.getByText('mock InfoScreen')
  })

  it('should render csv row if a protocol requires a csv', () => {
    when(vi.mocked(useFeatureFlag)).calledWith('enableCsvFile').thenReturn(true)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
      runTimeParameters: [...mockRunTimeParameterData, mockCsvRtp],
    } as CompletedProtocolAnalysis)

    render(props)
    screen.getByText('CSV File')
    screen.getByText('mock.csv')
  })

  // ToDo Additional test will be implemented when chip component is added
  // Need to a case to test subtext default values/custom values
})
