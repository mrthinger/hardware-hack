import * as React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { Skeleton } from '..'

const render = (props: React.ComponentProps<typeof Skeleton>) => {
  return renderWithProviders(<Skeleton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Skeleton', () => {
  it('renders Skeleton with correct dimensions/style', () => {
    const props = {
      width: 'mockWidth',
      height: 'mockHeight',
      backgroundSize: 'mockBackgroundSize',
    }
    render(props)
    const skeleton = screen.getByTestId('Skeleton')
    expect(skeleton).toHaveStyle('animation: shimmer 2s infinite linear')
    expect(skeleton).toHaveStyle(`width : ${props.width}`)
    expect(skeleton).toHaveStyle(`height: ${props.height}`)
    expect(skeleton).toHaveStyle(`background-size: ${props.backgroundSize}`)
  })
})
