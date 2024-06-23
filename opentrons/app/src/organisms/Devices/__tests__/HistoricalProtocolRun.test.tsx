import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useRunStatus, useRunTimestamps } from '../../RunTimeControl/hooks'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'
import { HistoricalProtocolRunOverflowMenu } from '../HistoricalProtocolRunOverflowMenu'
import type { RunStatus, RunData } from '@opentrons/api-client'

vi.mock('../../../redux/protocol-storage')
vi.mock('../../RunTimeControl/hooks')
vi.mock('../HistoricalProtocolRunOverflowMenu')

const run = {
  current: false,
  id: 'test_id',
  protocolId: 'test_protocol_id',
  status: 'succeeded' as RunStatus,
} as RunData

const render = (props: React.ComponentProps<typeof HistoricalProtocolRun>) => {
  return renderWithProviders(<HistoricalProtocolRun {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecentProtocolRuns', () => {
  let props: React.ComponentProps<typeof HistoricalProtocolRun>

  beforeEach(() => {
    props = {
      robotName: 'otie',
      protocolName: 'my protocol',
      protocolKey: 'protocolKeyStub',
      robotIsBusy: false,
      run: run,
    }
    vi.mocked(HistoricalProtocolRunOverflowMenu).mockReturnValue(
      <div>mock HistoricalProtocolRunOverflowMenu</div>
    )
    vi.mocked(useRunStatus).mockReturnValue('succeeded')
    vi.mocked(useRunTimestamps).mockReturnValue({
      startedAt: '2022-05-04T18:24:40.833862+00:00',
      pausedAt: '',
      stoppedAt: '',
      completedAt: '2022-05-04T18:24:41.833862+00:00',
    })
    vi.mocked(getStoredProtocols).mockReturnValue([storedProtocolDataFixture])
  })

  it('renders the correct information derived from run and protocol', () => {
    render(props)
    screen.debug()
    screen.getByText('Completed')
    screen.getByText('mock HistoricalProtocolRunOverflowMenu')
  })
  it('renders buttons that are not clickable when the protocol was deleted from the app directory', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([storedProtocolDataFixture])
    props = {
      robotName: 'otie',
      protocolName: 'my protocol',
      protocolKey: '12345',
      robotIsBusy: false,
      run: run,
    }
    render(props)
    screen.getByText('Completed')
    screen.getByText('mock HistoricalProtocolRunOverflowMenu')
  })
})
