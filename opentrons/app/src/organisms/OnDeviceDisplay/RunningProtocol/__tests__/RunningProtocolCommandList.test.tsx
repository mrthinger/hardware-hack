import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { RUN_STATUS_RUNNING, RUN_STATUS_IDLE } from '@opentrons/api-client'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRobotSideAnalysis } from '../../../../molecules/Command/__fixtures__'
import { RunningProtocolCommandList } from '../RunningProtocolCommandList'

const mockPlayRun = vi.fn()
const mockPauseRun = vi.fn()
const mockShowModal = vi.fn()

const render = (
  props: React.ComponentProps<typeof RunningProtocolCommandList>
) => {
  return renderWithProviders(<RunningProtocolCommandList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RunningProtocolCommandList', () => {
  let props: React.ComponentProps<typeof RunningProtocolCommandList>
  beforeEach(() => {
    props = {
      runStatus: RUN_STATUS_RUNNING,
      robotSideAnalysis: mockRobotSideAnalysis,
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      setShowConfirmCancelRunModal: mockShowModal,
      trackProtocolRunEvent: vi.fn(), // temporary
      robotAnalyticsData: {} as any,
      protocolName: 'mockRunningProtocolName',
      currentRunCommandIndex: 0,
      robotType: FLEX_ROBOT_TYPE,
    }
  })
  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Running')
    screen.getByText('mockRunningProtocolName')
    screen.getByText('Load P300 Single-Channel GEN1 in Left Mount')
    screen.getByLabelText('stop')
    screen.getByLabelText('pause')
  })

  it('should render play button when runStatus is idle', () => {
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    screen.getByLabelText('play')
  })

  it('when tapping stop button, the modal is showing up', () => {
    render(props)
    const button = screen.getByLabelText('stop')
    fireEvent.click(button)
    expect(mockShowModal).toHaveBeenCalled()
  })

  // ToDo (kj:04/10/2023) once we fix the track event stuff, we can implement tests
  it.todo('when tapping play button, track event mock function is called')
})
