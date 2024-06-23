import * as React from 'react'
import { it, describe, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { COLORS, SIZE_1 } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import { RenderResult } from '../RenderResult'

const render = (props: React.ComponentProps<typeof RenderResult>) => {
  return renderWithProviders(<RenderResult {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RenderResult', () => {
  let props: React.ComponentProps<typeof RenderResult>

  beforeEach(() => {
    props = {
      isBadCal: false,
    }
  })

  it('should render calibration result and icon - isBadCal: false', () => {
    render(props)
    screen.getByText('Good calibration')
    const icon = screen.getByTestId('RenderResult_icon')
    expect(icon).toHaveStyle(`color: ${String(COLORS.green50)}`)
    expect(icon).toHaveStyle(`height: ${String(SIZE_1)}`)
    expect(icon).toHaveStyle(`width: ${String(SIZE_1)}`)
  })

  it('should render calibration result and icon - isBadCal: true', () => {
    props.isBadCal = true
    render(props)
    screen.getByText('Recalibration recommended')
    const icon = screen.getByTestId('RenderResult_icon')
    expect(icon).toHaveStyle(`color: ${String(COLORS.yellow50)}`)
    expect(icon).toHaveStyle(`height: ${String(SIZE_1)}`)
    expect(icon).toHaveStyle(`width: ${String(SIZE_1)}`)
  })
})
