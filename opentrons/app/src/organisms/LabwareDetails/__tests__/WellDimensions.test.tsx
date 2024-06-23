import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import {
  mockDefinition,
  mockCircularLabwareWellGroupProperties,
  mockRectangularLabwareWellGroupProperties,
} from '../../../redux/custom-labware/__fixtures__'
import { WellDimensions } from '../WellDimensions'

const render = (props: React.ComponentProps<typeof WellDimensions>) => {
  return renderWithProviders(<WellDimensions {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellDimensions', () => {
  let props: React.ComponentProps<typeof WellDimensions>
  beforeEach(() => {
    props = {
      labwareParams: mockDefinition.parameters,
      wellProperties: mockCircularLabwareWellGroupProperties,
      wellLabel: 'mockLabel',
      category: 'mockCategory',
      labelSuffix: 'mockSuffix',
    }
  })

  it('renders correct label and headings for circular well', () => {
    render(props)

    screen.getByText('mockLabel Measurements (mm) mockSuffix')
    screen.getByRole('heading', { name: 'depth' })
    screen.getByRole('heading', { name: 'diameter' })
  })

  it('renders correct label and headings for rectangular well', () => {
    props.wellProperties = mockRectangularLabwareWellGroupProperties
    render(props)

    screen.getByText('mockLabel Measurements (mm) mockSuffix')
    screen.getByRole('heading', { name: 'depth' })
    screen.getByRole('heading', { name: 'x-size' })
    screen.getByRole('heading', { name: 'y-size' })
  })

  it('does not render total length heading when isTipRack is false', () => {
    render(props)

    expect(
      screen.queryByRole('heading', { name: 'total length' })
    ).not.toBeInTheDocument()
  })

  it('renders correct heading when isTipRack is true', () => {
    props.labwareParams.isTiprack = true
    render(props)

    screen.getByRole('heading', { name: 'total length' })
  })
})
