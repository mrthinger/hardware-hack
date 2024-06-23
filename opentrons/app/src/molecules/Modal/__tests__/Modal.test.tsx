import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { ModalHeader } from '../ModalHeader'
import { Modal } from '../Modal'

vi.mock('../ModalHeader')

const render = (props: React.ComponentProps<typeof Modal>) => {
  return renderWithProviders(<Modal {...props} />)[0]
}

describe('Modal', () => {
  let props: React.ComponentProps<typeof Modal>
  beforeEach(() => {
    props = {
      onOutsideClick: vi.fn(),
      children: <div>children</div>,
    }
    vi.mocked(ModalHeader).mockReturnValue(<div>mock Modal Header</div>)
  })
  it('should render the modal with no header', () => {
    render(props)
    screen.getByText('children')
    screen.getByLabelText('modal_medium')
    expect(screen.queryByText('mock Modal Header')).not.toBeInTheDocument()
  })
  it('should render the modal with header and large modal size', () => {
    props = {
      ...props,
      modalSize: 'large',
      header: { title: 'title' },
    }
    render(props)
    screen.getByText('children')
    screen.getByLabelText('modal_large')
    screen.getByText('mock Modal Header')
  })
  it('should render the modal with small modal size', () => {
    props = {
      ...props,
      modalSize: 'small',
    }
    render(props)
    screen.getByText('children')
    screen.getByLabelText('modal_small')
  })
  it('presses the background overlay and calls onoutsideClick', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay'))
    expect(props.onOutsideClick).toHaveBeenCalled()
  })
})
