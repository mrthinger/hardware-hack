import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ManufacturerDetails } from '../ManufacturerDetails'

const render = (props: React.ComponentProps<typeof ManufacturerDetails>) => {
  return renderWithProviders(<ManufacturerDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ManufacturerDetails', () => {
  let props: React.ComponentProps<typeof ManufacturerDetails>
  beforeEach(() => {
    props = {
      brand: { brand: 'Opentrons' },
    }
  })

  it('renders correct heading and manufacturerValue and no links or brandId when only brand is passed as prop', () => {
    render(props)
    screen.getByRole('heading', { name: 'manufacturer' })
    screen.getByText('Opentrons')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'manufacturer / catalog #' })
    ).not.toBeInTheDocument()
  })

  it('renders correct number of links', () => {
    props.brand.links = ['https://www.opentrons.com', 'https://www.test.com']
    render(props)
    expect(screen.getAllByRole('link', { name: 'website' })).toHaveLength(2)
  })

  it('renders brandIds', () => {
    props.brand.brandId = ['mockId', 'mockId2']
    render(props)
    screen.getByRole('heading', { name: 'manufacturer / catalog #' })
    screen.getByText('mockId, mockId2')
  })
})
