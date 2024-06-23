import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi, it, describe, expect, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ClearDeckModal } from '../ClearDeckModal'

const render = (props: React.ComponentProps<typeof ClearDeckModal>) => {
  return renderWithProviders(<ClearDeckModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('ClearDeckModal', () => {
  let props: React.ComponentProps<typeof ClearDeckModal>
  beforeEach(() => {
    props = {
      onContinueClick: vi.fn(),
    }
  })
  it('renders the correct information when pipette is not attached', () => {
    render(props)
    screen.getByText('Before you begin')
    screen.getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
  })

  it('renders the correct information when pipette is attached', () => {
    render(props)
    screen.getByText('Before you begin')
    screen.getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    const cont = screen.getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)
    expect(props.onContinueClick).toHaveBeenCalled()
  })
})
