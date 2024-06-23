import * as React from 'react'
import { describe, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { InstrumentContainer } from '..'

const render = (props: React.ComponentProps<typeof InstrumentContainer>) => {
  return renderWithProviders(<InstrumentContainer {...props} />)[0]
}

describe('InstrumentContainer', () => {
  let props: React.ComponentProps<typeof InstrumentContainer>

  it('renders an instrument display name', () => {
    props = {
      displayName: 'P300 8-Channel GEN2',
    }
    render(props)
    screen.getByText('P300 8-Channel GEN2')
  })
})
