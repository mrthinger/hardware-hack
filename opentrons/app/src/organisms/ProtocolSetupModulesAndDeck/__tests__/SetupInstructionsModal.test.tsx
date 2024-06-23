import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { SetupInstructionsModal } from '../SetupInstructionsModal'

const mockSetShowSetupInstructionsModal = vi.fn()
const QR_CODE_IMAGE_FILE =
  '/app/src/assets/images/on-device-display/setup_instructions_qr_code.png'

const render = (props: React.ComponentProps<typeof SetupInstructionsModal>) => {
  return renderWithProviders(<SetupInstructionsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupInstructionsModal', () => {
  let props: React.ComponentProps<typeof SetupInstructionsModal>

  beforeEach(() => {
    props = {
      setShowSetupInstructionsModal: mockSetShowSetupInstructionsModal,
    }
  })

  it('should render text and image', () => {
    render(props)
    screen.getByText('Setup instructions')
    screen.getByText(
      'For step-by-step instructions on setting up your module, consult the Quickstart Guide that came in its box or scan the QR code to visit the modules section of the Opentrons Help Center.'
    )
    screen.getByText('support.opentrons.com/s/modules')
    expect(screen.getByRole('img').getAttribute('src')).toEqual(
      QR_CODE_IMAGE_FILE
    )
  })

  it('should call mock function when tapping close icon', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(mockSetShowSetupInstructionsModal).toHaveBeenCalled()
  })
})
