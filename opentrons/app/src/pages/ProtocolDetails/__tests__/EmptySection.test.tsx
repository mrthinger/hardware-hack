import * as React from 'react'
import { it, describe } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { EmptySection } from '../EmptySection'

const render = (props: React.ComponentProps<typeof EmptySection>) => {
  return renderWithProviders(<EmptySection {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EmptySection', () => {
  let props: React.ComponentProps<typeof EmptySection>

  it('should render text for labware', () => {
    props = {
      section: 'labware',
    }
    render(props)
    screen.getByLabelText('EmptySection_ot-alert')
    screen.getByText('No labware is specified for this protocol')
  })
  it('should render text for liquid', () => {
    props = {
      section: 'liquids',
    }
    render(props)
    screen.getByText('No liquids are specified for this protocol')
  })
  it('should render text for hardware', () => {
    props = {
      section: 'hardware',
    }
    render(props)
    screen.getByText('No hardware is specified for this protocol')
  })
  it('should render text for parameters', () => {
    props = {
      section: 'parameters',
    }
    render(props)
    screen.getByText('No parameters specified in this protocol')
  })
})
