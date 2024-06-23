import * as React from 'react'
import { it, describe, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { COLORS, TYPOGRAPHY } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { CalibrationHealthCheckResults } from '../CalibrationHealthCheckResults'

const render = (
  props: React.ComponentProps<typeof CalibrationHealthCheckResults>
) => {
  return renderWithProviders(<CalibrationHealthCheckResults {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CalibrationHealthCheckResults', () => {
  let props: React.ComponentProps<typeof CalibrationHealthCheckResults>
  beforeEach(() => {
    props = {
      isCalibrationRecommended: false,
    }
  })

  it('should render title and success StatusLabel when all calibration is good', () => {
    render(props)
    screen.getByText('Calibration Health Check Results')
    const statusLabel = screen.getByText('Calibration complete')
    expect(statusLabel).toHaveStyle(`color: ${String(COLORS.black90)}`)
    expect(statusLabel).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(screen.getByTestId('status_circle')).toHaveStyle(
      `color: ${String(COLORS.green50)}`
    )
    expect(screen.getByTestId('status_circle')).toHaveStyle(`height: 0.3125rem`)
    expect(screen.getByTestId('status_circle')).toHaveStyle(`width: 0.3125rem`)
  })

  it('should render title and warning StatusLabel when calibration results includes bad', () => {
    props.isCalibrationRecommended = true
    render(props)
    screen.getByText('Calibration recommended')
    expect(screen.getByTestId('status_circle')).toHaveStyle(
      `color: ${String(COLORS.yellow50)}`
    )
  })
})
