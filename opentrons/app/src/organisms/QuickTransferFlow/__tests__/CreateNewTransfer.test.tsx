import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { DeckConfigurator } from '@opentrons/components'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { CreateNewTransfer } from '../CreateNewTransfer'

import type * as OpentronsComponents from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(),
  }
})
const render = (props: React.ComponentProps<typeof CreateNewTransfer>) => {
  return renderWithProviders(<CreateNewTransfer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CreateNewTransfer', () => {
  let props: React.ComponentProps<typeof CreateNewTransfer>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the create new transfer screen and header', () => {
    render(props)
    screen.getByText('Create new quick transfer')
    screen.getByText(
      'Quick transfers use deck slots B2-D2. These slots hold a tip rack, a source labware, and a destination labware.'
    )
    screen.getByText(
      'Make sure that your deck configuration is up to date to avoid collisions.'
    )
    expect(vi.mocked(DeckConfigurator)).toHaveBeenCalled()
  })
  it('renders exit and continue buttons and they work as expected', () => {
    render(props)
    const exitBtn = screen.getByText('Exit')
    fireEvent.click(exitBtn)
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
    const continueBtn = screen.getByText('Continue')
    fireEvent.click(continueBtn)
    expect(props.onNext).toHaveBeenCalled()
  })
})
