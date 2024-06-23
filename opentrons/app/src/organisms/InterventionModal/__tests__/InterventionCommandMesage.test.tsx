import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { InterventionCommandMessage } from '../InterventionCommandMessage'
import {
  longCommandMessage,
  shortCommandMessage,
  truncatedCommandMessage,
} from '../__fixtures__'

const render = (
  props: React.ComponentProps<typeof InterventionCommandMessage>
) => {
  return renderWithProviders(<InterventionCommandMessage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionCommandMessage', () => {
  let props: React.ComponentProps<typeof InterventionCommandMessage>

  it('truncates command text greater than 220 characters long', () => {
    props = { commandMessage: longCommandMessage }
    render(props)
    expect(screen.getByText(truncatedCommandMessage)).toBeTruthy()
  })

  it('does not truncate command text when shorter than 220 characters', () => {
    props = { commandMessage: shortCommandMessage }
    render(props)
    expect(screen.getByText(shortCommandMessage)).toBeTruthy()
  })

  it('displays a default message if pause step does not have a message', () => {
    props = { commandMessage: null }
    render(props)
    expect(screen.getByText('Pausing protocol')).toBeTruthy()
  })
})
