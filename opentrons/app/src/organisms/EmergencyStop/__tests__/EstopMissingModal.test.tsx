import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { getIsOnDevice } from '../../../redux/config'
import { EstopMissingModal } from '../EstopMissingModal'

vi.mock('../../../redux/config')

const render = (props: React.ComponentProps<typeof EstopMissingModal>) => {
  return renderWithProviders(<EstopMissingModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopMissingModal - Touchscreen', () => {
  let props: React.ComponentProps<typeof EstopMissingModal>

  beforeEach(() => {
    props = {
      robotName: 'mockFlex',
      closeModal: vi.fn(),
      isDismissedModal: false,
      setIsDismissedModal: vi.fn(),
    }
    vi.mocked(getIsOnDevice).mockReturnValue(true)
  })

  it('should render text', () => {
    render(props)
    screen.getByText('E-stop missing')
    screen.getByText('Connect the E-stop to continue')
    screen.getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
})

describe('EstopMissingModal - Desktop', () => {
  let props: React.ComponentProps<typeof EstopMissingModal>

  beforeEach(() => {
    props = {
      robotName: 'mockFlex',
      closeModal: vi.fn(),
      isDismissedModal: false,
      setIsDismissedModal: vi.fn(),
    }
    vi.mocked(getIsOnDevice).mockReturnValue(false)
  })

  it('should render text', () => {
    render(props)
    screen.getByText('E-stop missing')
    screen.getByText('Connect the E-stop to continue')
    screen.getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })

  it('should call a mock function when clicking close icon', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ModalHeader_icon_close_E-stop missing'))
    expect(props.setIsDismissedModal).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })
})
