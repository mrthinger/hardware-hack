import * as React from 'react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'
import { useDeckCalibrationData } from '../../hooks'
import { SetupPipetteCalibrationItem } from '../SetupPipetteCalibrationItem'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../hooks')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupPipetteCalibrationItem', () => {
  const render = ({
    pipetteInfo = mockPipetteInfo,
    mount = 'left',
    robotName = ROBOT_NAME,
    runId = RUN_ID,
  }: Partial<
    React.ComponentProps<typeof SetupPipetteCalibrationItem>
  > = {}) => {
    return renderWithProviders(
      <MemoryRouter>
        <SetupPipetteCalibrationItem
          {...{
            pipetteInfo,
            mount,
            robotName,
            runId,
          }}
        />
      </MemoryRouter>,
      { i18nInstance: i18n }
    )[0]
  }

  beforeEach(() => {
    when(vi.mocked(useDeckCalibrationData)).calledWith(ROBOT_NAME).thenReturn({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the mount and pipette name', () => {
    render()
    screen.getByText('Left Mount')
    screen.getByText(mockPipetteInfo.pipetteSpecs.displayName)
  })

  it('renders a link to the calibration dashboard if pipette attached but not calibrated', () => {
    render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })

    screen.getByText('Not calibrated yet')
    expect(
      screen
        .getByRole('link', {
          name: 'Calibrate now',
        })
        .getAttribute('href')
    ).toBe('/devices/otie/robot-settings/calibration/dashboard')
  })
  it('renders the pipette mismatch info if pipette calibrated but an inexact match', () => {
    render({
      pipetteInfo: {
        ...mockPipetteInfo,
        tipRacksForPipette: [],
        requestedPipetteMatch: 'inexact_match',
        pipetteCalDate: 'september 3, 2020',
      },
    })
    screen.getByRole('link', { name: 'Learn more' })
    screen.getByText('Pipette generation mismatch.')
  })
})
