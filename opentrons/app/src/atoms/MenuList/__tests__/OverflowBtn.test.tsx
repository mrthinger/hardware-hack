import * as React from 'react'
import { vi, it, expect, describe } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../__testing-utils__'
import { OverflowBtn } from '../OverflowBtn'

const render = (props: React.ComponentProps<typeof OverflowBtn>) => {
  return renderWithProviders(<OverflowBtn {...props} />)[0]
}

describe('OverflowBtn', () => {
  it('renders a clickable button', () => {
    const handleClick = vi.fn()
    render({
      onClick: handleClick,
    })

    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders a hover state', () => {
    render({
      onClick: vi.fn(),
    })
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.transparent}`
    )
  })
})
