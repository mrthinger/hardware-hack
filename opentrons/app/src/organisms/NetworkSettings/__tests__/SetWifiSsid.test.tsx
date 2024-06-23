import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { SetWifiSsid } from '../SetWifiSsid'

const mockSetSelectedSsid = vi.fn()
const render = (props: React.ComponentProps<typeof SetWifiSsid>) => {
  return renderWithProviders(
    <MemoryRouter>
      <SetWifiSsid {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetWifiSsid', () => {
  let props: React.ComponentProps<typeof SetWifiSsid>
  beforeEach(() => {
    props = {
      setInputSsid: mockSetSelectedSsid,
      errorMessage: null,
      inputSsid: 'mockSsid',
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render text, buttons, input and software keyboard', () => {
    render(props)
    screen.getByText('Enter network name')
    screen.getByLabelText('wifi_ssid')
    screen.getByRole('button', { name: 'a' })
    screen.getByRole('button', { name: 'b' })
    screen.getByRole('button', { name: 'c' })
  })

  it('when tapping keys, tapped key value is displayed in the input', () => {
    render(props)
    const inputBox = screen.getByLabelText('wifi_ssid')
    const aKey = screen.getByRole('button', { name: 'a' })
    const bKey = screen.getByRole('button', { name: 'b' })
    const cKey = screen.getByRole('button', { name: 'c' })
    fireEvent.click(aKey)
    fireEvent.click(bKey)
    fireEvent.click(cKey)
    expect(inputBox).toHaveValue('mockSsid')
  })
})
