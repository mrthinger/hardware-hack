import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

import { LargeButton } from '../LargeButton'

const render = (props: React.ComponentProps<typeof LargeButton>) => {
  return renderWithProviders(<LargeButton {...props} />)[0]
}

describe('LargeButton', () => {
  let props: React.ComponentProps<typeof LargeButton>
  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      buttonText: 'large button',
      iconName: 'play-round-corners',
    }
  })
  it('renders the default button and it works as expected', () => {
    render(props)
    fireEvent.click(screen.getByText('large button'))
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders the alert button', () => {
    props = {
      ...props,
      buttonType: 'alert',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.red35}`
    )
  })
  it('renders the secondary button', () => {
    props = {
      ...props,
      buttonType: 'secondary',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.blue35}`
    )
  })

  it('renders the onColor button', () => {
    props = {
      ...props,
      buttonType: 'onColor',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.transparent}`
    )
  })

  it('renders the alertAlt button', () => {
    props = {
      ...props,
      buttonType: 'alertAlt',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })

  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
