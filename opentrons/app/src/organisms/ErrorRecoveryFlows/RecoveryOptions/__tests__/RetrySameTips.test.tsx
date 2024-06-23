import * as React from 'react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { RetrySameTips, RetrySameTipsInfo } from '../RetrySameTips'
import { RECOVERY_MAP } from '../../constants'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'

vi.mock('../../../../molecules/Command')
vi.mock('../SelectRecoveryOption')

const render = (props: React.ComponentProps<typeof RetrySameTips>) => {
  return renderWithProviders(<RetrySameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const renderRetrySameTipsInfo = (
  props: React.ComponentProps<typeof RetrySameTipsInfo>
) => {
  return renderWithProviders(<RetrySameTipsInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetrySameTips', () => {
  let props: React.ComponentProps<typeof RetrySameTips>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders RetrySameTipsInfo when step is ${RECOVERY_MAP.RETRY_SAME_TIPS.STEPS.RETRY}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_SAME_TIPS.STEPS.RETRY,
      },
    }
    render(props)
    screen.getByText('Retry with same tips')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP',
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})

describe('RetrySameTipsInfo', () => {
  let props: React.ComponentProps<typeof RetrySameTipsInfo>
  let mockSetRobotInMotion: Mock
  let mockRetryFailedCommand: Mock
  let mockResumeRun: Mock

  beforeEach(() => {
    mockSetRobotInMotion = vi.fn(() => Promise.resolve())
    mockRetryFailedCommand = vi.fn(() => Promise.resolve())
    mockResumeRun = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        setRobotInMotion: mockSetRobotInMotion,
      } as any,
      recoveryCommands: {
        retryFailedCommand: mockRetryFailedCommand,
        resumeRun: mockResumeRun,
      } as any,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the component with the correct text', () => {
    renderRetrySameTipsInfo(props)
    screen.getByText('Retry with same tips')
    screen.queryByText('The robot will retry the step with the same tips.')
    screen.queryByText('Close the robot door before proceeding.')
  })

  it('calls the correct routeUpdateActions and recoveryCommands in the correct order when the primary button is clicked', async () => {
    renderRetrySameTipsInfo(props)
    fireEvent.click(screen.getByRole('button', { name: 'Retry now' }))

    await waitFor(() => {
      expect(mockSetRobotInMotion).toHaveBeenCalledWith(
        true,
        RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE
      )
    })
    await waitFor(() => {
      expect(mockRetryFailedCommand).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mockResumeRun).toHaveBeenCalled()
    })

    expect(mockSetRobotInMotion.mock.invocationCallOrder[0]).toBeLessThan(
      mockRetryFailedCommand.mock.invocationCallOrder[0]
    )
    expect(mockRetryFailedCommand.mock.invocationCallOrder[0]).toBeLessThan(
      mockResumeRun.mock.invocationCallOrder[0]
    )
  })
})
