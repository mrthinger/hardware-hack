import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockCircularLabwareWellGroupProperties } from '../../../redux/custom-labware/__fixtures__'
import { WellProperties } from '../WellProperties'

const render = (props: React.ComponentProps<typeof WellProperties>) => {
  return renderWithProviders(<WellProperties {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellProperties', () => {
  let props: React.ComponentProps<typeof WellProperties>
  beforeEach(() => {
    props = {
      wellProperties: mockCircularLabwareWellGroupProperties,
      wellLabel: 'mockLabel',
      displayVolumeUnits: 'mL',
    }
  })

  it('renders correct heading and label when wellBottomShape exists', () => {
    render(props)

    screen.getByRole('heading', { name: 'max volume' })
    screen.getByText('0.01 mL')
    screen.getByRole('heading', { name: 'mockLabel shape' })
    screen.getByText('Flat_Bottom')
  })

  it('does not render wellBottomShape section when wellBottomShape is null', () => {
    props.wellProperties.metadata.wellBottomShape = undefined
    render(props)

    expect(
      screen.queryByRole('heading', { name: 'mockLabel shape' })
    ).not.toBeInTheDocument()
  })

  it('renders correct label when volume is null', () => {
    props.wellProperties.totalLiquidVolume = null
    render(props)

    expect(screen.queryByText('0.01 mL')).not.toBeInTheDocument()
    screen.getByText('various')
  })
})
