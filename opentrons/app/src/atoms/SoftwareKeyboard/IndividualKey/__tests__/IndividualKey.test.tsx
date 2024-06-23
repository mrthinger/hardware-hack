import * as React from 'react'
import { describe, it, vi, expect } from 'vitest'
import { fireEvent, renderHook, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { IndividualKey } from '..'

const render = (props: React.ComponentProps<typeof IndividualKey>) => {
  return renderWithProviders(<IndividualKey {...props} />)[0]
}

describe('IndividualKey', () => {
  it('should render the text key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      keyText: 'mockKey',
    }
    render(props)
    screen.getByRole('button', { name: 'mockKey' })
  })

  it('should call mock function when clicking text key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
      keyText: 'mockKey',
    }
    render(props)
    const textKey = screen.getByRole('button', { name: 'mockKey' })
    fireEvent.click(textKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
