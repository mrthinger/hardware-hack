import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { StaticRouter } from 'react-router-dom'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { i18n } from '../../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../../redux/analytics'
import { BackToTopButton } from '../BackToTopButton'
import { useRobot } from '../../hooks'

import type { Mock } from 'vitest'

vi.mock('../../../../redux/analytics')
vi.mock('../../hooks')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const ROBOT_SERIAL_NUMBER = 'OT123'

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <BackToTopButton
        protocolRunHeaderRef={null}
        robotName={ROBOT_NAME}
        runId={RUN_ID}
        sourceLocation="test run button"
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

let mockTrackEvent: Mock

describe('BackToTopButton', () => {
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    when(vi.mocked(useTrackEvent)).calledWith().thenReturn(mockTrackEvent)
    vi.mocked(useRobot).mockReturnValue({
      ...mockConnectableRobot,
      health: {
        ...mockConnectableRobot.health,
        robot_serial: ROBOT_SERIAL_NUMBER,
      },
    })
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should be enabled with no tooltip if there are no missing Ids', () => {
    render()
    const button = screen.getByRole('link', { name: 'Back to top' })
    expect(button).not.toBeDisabled()
    expect(button.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/1/setup'
    )
  })

  it('should track a mixpanel event when clicked', () => {
    render()
    const button = screen.getByRole('link', { name: 'Back to top' })
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: {
        sourceLocation: 'test run button',
        robotSerialNumber: ROBOT_SERIAL_NUMBER,
      },
    })
  })

  it('should always be enabled', () => {
    render()
    const button = screen.getByRole('button', { name: 'Back to top' })
    expect(button).not.toBeDisabled()
  })
})
