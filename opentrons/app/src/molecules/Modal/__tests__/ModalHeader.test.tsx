import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { ModalHeader } from '../ModalHeader'

const render = (props: React.ComponentProps<typeof ModalHeader>) => {
  return renderWithProviders(<ModalHeader {...props} />)[0]
}

describe('ModalHeader', () => {
  let props: React.ComponentProps<typeof ModalHeader>
  beforeEach(() => {
    props = {
      title: 'title',
    }
  })
  it('should render the title', () => {
    render(props)
    screen.getByText('title')
  })
  it('shoulder render the optional props', () => {
    props = {
      ...props,
      hasExitIcon: true,
      iconName: 'information',
      iconColor: COLORS.black90,
      onClick: vi.fn(),
    }
    render(props)
    expect(screen.getByLabelText('icon_information')).toHaveStyle(
      `color: ${COLORS.black90}`
    )
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
