import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { MenuList } from '..'

const render = (props: React.ComponentProps<typeof MenuList>) => {
  return renderWithProviders(<MenuList {...props} />)[0]
}

const mockBtn = <div key="fakeKey">mockBtn</div>

describe('MenuList', () => {
  let props: React.ComponentProps<typeof MenuList>
  beforeEach(() => {
    props = {
      children: mockBtn,
    }
  })

  it('renders a child not on device', () => {
    render(props)
    screen.getByText('mockBtn')
  })
  it('renders isOnDevice child, clicking background overlay calls onClick', () => {
    props = {
      ...props,
      isOnDevice: true,
      onClick: vi.fn(),
    }
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay_ModalShell'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
