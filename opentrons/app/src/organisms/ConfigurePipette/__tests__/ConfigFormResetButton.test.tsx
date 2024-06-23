import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi, it, expect, describe, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ConfigFormResetButton } from '../ConfigFormResetButton'

const render = (props: React.ComponentProps<typeof ConfigFormResetButton>) => {
  return renderWithProviders(<ConfigFormResetButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfigFormResetButton', () => {
  let props: React.ComponentProps<typeof ConfigFormResetButton>
  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      disabled: false,
    }
  })

  it('renders text and not disabled', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'Reset all' })
    screen.getByText(
      'These are advanced settings. Please do not attempt to adjust without assistance from Opentrons Support. Changing these settings may affect the lifespan of your pipette.'
    )
    screen.getByText(
      'These settings do not override any pipette settings defined in protocols.'
    )
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders button text and is disabled', () => {
    props = {
      onClick: vi.fn(),
      disabled: true,
    }
    render(props)
    const button = screen.getByRole('button', { name: 'Reset all' })
    expect(button).toBeDisabled()
  })
})
