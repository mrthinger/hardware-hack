import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { TextSize } from '../TextSize'

const mockFunc = vi.fn()
const render = (props: React.ComponentProps<typeof TextSize>) => {
  return renderWithProviders(<TextSize {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TextSize', () => {
  let props: React.ComponentProps<typeof TextSize>

  beforeEach(() => {
    props = {
      setCurrentOption: mockFunc,
    }
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByTestId('DisplayTextSize_back_button')
    screen.getByTestId('DisplayTextSize_decrease')
    screen.getByTestId('DisplayTextSize_increase')
  })

  // ToDo (kj:03/03/2023) These cases will be added when text size change method is decided
  it.todo('should call mock function when tapping plus button')
  it.todo('should call mock function when tapping minus button')

  it('should call mock function when tapping back button', () => {
    render(props)
    const button = screen.getByTestId('DisplayTextSize_back_button')
    fireEvent.click(button)
    expect(mockFunc).toHaveBeenCalled()
  })
})
