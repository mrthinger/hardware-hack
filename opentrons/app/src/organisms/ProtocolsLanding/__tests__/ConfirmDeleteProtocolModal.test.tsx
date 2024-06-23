import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ConfirmDeleteProtocolModal } from '../ConfirmDeleteProtocolModal'

const render = (
  props: React.ComponentProps<typeof ConfirmDeleteProtocolModal>
) => {
  return renderWithProviders(<ConfirmDeleteProtocolModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmDeleteProtocolModal', () => {
  let props: React.ComponentProps<typeof ConfirmDeleteProtocolModal>

  beforeEach(() => {
    props = {
      cancelDeleteProtocol: vi.fn(),
      handleClickDelete: vi.fn(),
    }
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders correct text', () => {
    render(props)
    screen.getByText('Delete this protocol?')
    screen.getByText(
      'This protocol will be moved to this computer’s trash and may be unrecoverable.'
    )
  })

  it('renders buttons and clicking on them call corresponding props', () => {
    props = {
      cancelDeleteProtocol: vi.fn(),
      handleClickDelete: vi.fn(),
    }
    render(props)
    const cancel = screen.getByText('cancel')
    fireEvent.click(cancel)
    expect(props.cancelDeleteProtocol).toHaveBeenCalled()
    const confirm = screen.getByRole('button', { name: 'Yes, delete protocol' })
    fireEvent.click(confirm)
    expect(props.handleClickDelete).toHaveBeenCalled()
  })
})
