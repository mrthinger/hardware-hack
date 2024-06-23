import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import { renderWithProviders } from '../../../__testing-utils__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../redux/calibration/tip-length/__fixtures__'
import { mockAttachedPipette } from '../../../redux/pipettes/__fixtures__'
import {
  useAttachedPipettes,
  useTipLengthCalibrations,
} from '../../../organisms/Devices/hooks'

import { RobotSettingsTipLengthCalibration } from '../RobotSettingsTipLengthCalibration'
import { TipLengthCalibrationItems } from '../CalibrationDetails/TipLengthCalibrationItems'

import type { FormattedPipetteOffsetCalibration } from '..'
import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

vi.mock('../../../redux/config')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../CalibrationDetails/TipLengthCalibrationItems')

const mockFormattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] = []

const mockUpdateRobotStatus = vi.fn()

const render = () => {
  return renderWithProviders(
    <RobotSettingsTipLengthCalibration
      formattedPipetteOffsetCalibrations={
        mockFormattedPipetteOffsetCalibrations
      }
      robotName="otie"
      updateRobotStatus={mockUpdateRobotStatus}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettingsTipLengthCalibration', () => {
  beforeEach(() => {
    vi.mocked(useTipLengthCalibrations).mockReturnValue([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
    vi.mocked(TipLengthCalibrationItems).mockReturnValue(
      <div>Mock TipLengthCalibrationItems</div>
    )
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useAttachedPipettes).mockReturnValue({
      left: mockAttachedPipette,
      right: null,
    } as AttachedPipettesByMount)
  })

  it('renders a title', () => {
    render()
    screen.getByText('Tip Length Calibrations')
    screen.getByText('Mock TipLengthCalibrationItems')
  })
})
