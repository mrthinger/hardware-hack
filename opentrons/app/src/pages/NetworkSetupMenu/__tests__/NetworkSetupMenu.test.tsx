import * as React from 'react'
import { vi, it, describe, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { NetworkSetupMenu } from '..'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <NetworkSetupMenu />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('NetworkSetupMenu', () => {
  it('should render text and button, and step meter', () => {
    render()

    screen.getByText('Choose network type')
    screen.getByText(
      'You’ll use this connection to run software updates and load protocols onto your Opentrons Flex.'
    )
    screen.getByText('Wi-Fi')
    screen.getByText('Find a network in your lab or enter your own.')
    screen.getByText('Ethernet')
    screen.getByText("Connect to your lab's wired network.")
    screen.getByText('USB')
    screen.getByText(
      'Connect directly to a computer (running the Opentrons App).'
    )
  })

  it('should call mock function when tapping a button', () => {
    render()
    const wifiButton = screen.getByText('Wi-Fi')
    const ethernetButton = screen.getByText('Ethernet')
    const usbButton = screen.getByText('USB')
    fireEvent.click(wifiButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
    fireEvent.click(ethernetButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/ethernet')
    fireEvent.click(usbButton)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
