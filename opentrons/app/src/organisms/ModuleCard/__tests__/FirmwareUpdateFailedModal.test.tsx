import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockTemperatureModule } from '../../../redux/modules/__fixtures__'
import { FirmwareUpdateFailedModal } from '../FirmwareUpdateFailedModal'

const render = (
  props: React.ComponentProps<typeof FirmwareUpdateFailedModal>
) => {
  return renderWithProviders(<FirmwareUpdateFailedModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FirmwareUpdateFailedModal', () => {
  let props: React.ComponentProps<typeof FirmwareUpdateFailedModal>
  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      module: mockTemperatureModule,
      errorMessage: 'error message',
    }
  })

  it('should render the correct header and body', () => {
    render(props)
    screen.getByText('Failed to update module firmware')
    screen.getByText(
      'An error occurred while updating your Temperature Module GEN1. Please try again.'
    )
    screen.getByText('error message')
  })
  it('should call onCloseClick when the close button is pressed', () => {
    render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
    const closeIcon = screen.getByLabelText('information')
    fireEvent.click(closeIcon)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
