import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { TakeoverModal } from '../TakeoverModal'

const render = (props: React.ComponentProps<typeof TakeoverModal>) => {
  return renderWithProviders(<TakeoverModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TakeoverModal', () => {
  let props: React.ComponentProps<typeof TakeoverModal>
  beforeEach(() => {
    props = {
      showConfirmTerminateModal: false,
      setShowConfirmTerminateModal: vi.fn(),
      confirmTerminate: vi.fn(),
      terminateInProgress: false,
    }
  })

  it('renders information for Robot is busy modal', () => {
    render(props)
    screen.getByText('Robot is busy')
    screen.getByText(
      'A computer with the Opentrons App is currently controlling this robot.'
    )
    fireEvent.click(screen.getByText('Terminate remote activity'))
    expect(props.setShowConfirmTerminateModal).toHaveBeenCalled()
  })

  it('renders information for confirm terminate modal', () => {
    props = {
      ...props,
      showConfirmTerminateModal: true,
    }
    render(props)
    screen.getByText('Terminate remote activity?')
    screen.getByText(
      'This will immediately stop the activity begun on a computer. You, or another user, may lose progress or see an error in the Opentrons App.'
    )
    fireEvent.click(screen.getByText('Continue activity'))
    expect(props.setShowConfirmTerminateModal).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Terminate activity'))
    expect(props.confirmTerminate).toHaveBeenCalled()
  })
})
