import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockCircularLabwareWellGroupProperties } from '../../../redux/custom-labware/__fixtures__'
import { WellSpacing } from '../WellSpacing'

const render = (props: React.ComponentProps<typeof WellSpacing>) => {
  return renderWithProviders(<WellSpacing {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellSpacing', () => {
  let props: React.ComponentProps<typeof WellSpacing>
  beforeEach(() => {
    props = {
      wellProperties: mockCircularLabwareWellGroupProperties,
    }
  })

  it('renders correct labels', () => {
    props.wellProperties = {
      ...props.wellProperties,
      xSpacing: 2.22227,
      ySpacing: 2.22227,
    }
    render(props)
    expect(screen.getAllByText('2.22')).toHaveLength(2)
  })

  it('renders correct labels when xSpacing and ySpacing have values', () => {
    render(props)

    screen.getByRole('heading', { name: 'x-offset' })
    screen.getByRole('heading', { name: 'y-offset' })
    screen.getByRole('heading', { name: 'x-spacing' })
    screen.getByRole('heading', { name: 'y-spacing' })
    expect(screen.getAllByText('1.00')).toHaveLength(4)
  })

  it('renders correct labels when xSpacing and ySpacing are null', () => {
    props.wellProperties = {
      ...props.wellProperties,
      xSpacing: null,
      ySpacing: null,
    }
    render(props)

    expect(screen.getAllByText('1.00')).toHaveLength(2)
    expect(screen.getAllByText('various')).toHaveLength(2)
  })
})
