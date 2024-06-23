import * as React from 'react'
import { describe, it, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { InfoMessage } from '..'

const render = (props: React.ComponentProps<typeof InfoMessage>) => {
  return renderWithProviders(<InfoMessage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InfoMessage', () => {
  let props: React.ComponentProps<typeof InfoMessage>

  beforeEach(() => {
    props = {
      title: 'a message from otie',
    }
  })
  it('renders info message', () => {
    render(props)
    screen.getByLabelText('icon_information')
    screen.getByText('a message from otie')
  })
  it('renders info message body', () => {
    props = {
      title: 'a message from otie',
      body: 'the run has started',
    }
    render(props)
    screen.getByText('the run has started')
  })
})
