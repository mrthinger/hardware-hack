import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi, it, describe, expect } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { MeasureTip } from '../MeasureTip'

describe('MeasureTip', () => {
  const mockSendCommands = vi.fn()
  const mockDeleteSession = vi.fn()
  const render = (
    props: Partial<React.ComponentProps<typeof MeasureTip>> = {}
  ) => {
    const {
      mount = 'left',
      isMulti = false,
      tipRack = mockTipLengthTipRack,
      calBlock = mockTipLengthCalBlock,
      sendCommands = mockSendCommands,
      cleanUpAndExit = mockDeleteSession,
      currentStep = Sessions.TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
      sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    } = props
    return renderWithProviders(
      <MeasureTip
        isMulti={isMulti}
        mount={mount}
        tipRack={tipRack}
        calBlock={calBlock}
        sendCommands={sendCommands}
        cleanUpAndExit={cleanUpAndExit}
        currentStep={currentStep}
        sessionType={sessionType}
      />,
      { i18nInstance: i18n }
    )
  }

  it('renders the confirm crash modal when invoked', () => {
    render()
    expect(
      screen.queryByText('Starting over will cancel your calibration progress.')
    ).toBeNull()
    const crashLink = screen.getByText('Start over')
    fireEvent.click(crashLink)
    screen.getByText('Starting over will cancel your calibration progress.')
  })

  it('renders the need help link', () => {
    render()
    screen.getByRole('link', { name: 'Need help?' })
  })

  it('jogging sends command', () => {
    render()
    const button = screen.getByRole('button', { name: 'forward' })
    fireEvent.click(button)

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.JOG,
      data: { vector: [0, -0.1, 0] },
    })
  })

  it('clicking proceed sends save offset and move to tip rack commands for tip length cal', () => {
    render({ sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION })
    const button = screen.getByRole('button', { name: 'Confirm placement' })
    fireEvent.click(button)
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
      }
    )
  })

  it('clicking proceed sends only move to tip rack commands for cal health check', () => {
    render({ sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK })
    const button = screen.getByRole('button', { name: 'Confirm placement' })
    fireEvent.click(button)
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.checkCommands.COMPARE_POINT,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_DECK,
      }
    )
  })
})
