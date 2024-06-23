import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ConfirmExitModal } from '../ConfirmExitModal'

const render = (props: React.ComponentProps<typeof ConfirmExitModal>) => {
  return renderWithProviders(<ConfirmExitModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConfirmExitModal', () => {
  let props: React.ComponentProps<typeof ConfirmExitModal>

  beforeEach(() => {
    props = {
      confirmExit: vi.fn(),
      cancelExit: vi.fn(),
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the create new transfer screen and header', () => {
    render(props)
    screen.getByText('Exit quick transfer?')
    screen.getByText('You will lose all progress on this quick transfer.')
  })
  it('renders exit and cancel buttons and they work as expected', () => {
    render(props)
    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)
    expect(props.cancelExit).toHaveBeenCalled()
    const deleteBtn = screen.getByText('Delete')
    fireEvent.click(deleteBtn)
    expect(props.confirmExit).toHaveBeenCalled()
  })
})
