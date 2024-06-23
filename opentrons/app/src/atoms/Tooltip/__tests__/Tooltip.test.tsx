import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import {
  TOOLTIP_TOP,
  SPACING,
  COLORS,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { Tooltip } from '..'

const render = (props: React.ComponentProps<typeof Tooltip>) => {
  return renderWithProviders(<Tooltip {...props} />)[0]
}

const placement = TOOLTIP_TOP
const id = 'Tooltip_123'
const tooltipRef = vi.fn()
const tooltipStyle = {
  position: POSITION_ABSOLUTE,
  left: SPACING.spacing4,
} as const
const arrowRef = vi.fn()
const arrowStyle = {
  position: POSITION_ABSOLUTE,
  left: SPACING.spacing8,
} as const

const MockTooltipProps = {
  id: id,
  placement: placement,
  arrowStyle: arrowStyle,
  arrowRef: arrowRef,
  visible: true,
  ref: tooltipRef,
  style: tooltipStyle,
}

describe('Tooltip', () => {
  let props: React.ComponentProps<typeof Tooltip>

  beforeEach(() => {
    props = {
      children: 'mock children' as React.ReactNode,
      tooltipProps: MockTooltipProps,
      key: 'mock key',
    }
  })

  it('renders correct children when the tooltip is visible', () => {
    render(props)
    const tooltip = screen.getByText('mock children')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveStyle('position: absolute')
    expect(tooltip).toHaveStyle('left: 0.25rem')
    expect(tooltip).toHaveStyle(`background: ${COLORS.black90}`)
    expect(tooltip).toHaveStyle(`color: ${COLORS.white}`)
    expect(tooltip).toHaveStyle('width: 8.75rem')
    expect(tooltip).toHaveStyle('font-size: 0.625rem')
    expect(tooltip).toHaveAttribute('role', 'tooltip')
  })

  it('renders correct children when the tooltip is visible with a specific with', () => {
    props = { ...props, width: '3rem' }
    render(props)
    const tooltip = screen.getByText('mock children')
    expect(tooltip).toHaveStyle('width: 3rem')
  })

  it('does not render children when the tooltip is invisible', () => {
    MockTooltipProps.visible = false
    render(props)
    const tooltip = screen.queryByText('mock children')
    expect(tooltip).not.toBeInTheDocument()
  })
})
