import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { HeaterShakerSlideout } from '../HeaterShakerSlideout'

vi.mock('@opentrons/react-api-client')

const render = (props: React.ComponentProps<typeof HeaterShakerSlideout>) => {
  return renderWithProviders(<HeaterShakerSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof HeaterShakerSlideout>
  let mockCreateLiveCommand = vi.fn()

  beforeEach(() => {
    mockCreateLiveCommand = vi.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    vi.mocked(useCreateLiveCommandMutation).mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title and body for heatershaker set temperature', () => {
    props = {
      module: mockHeaterShaker,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)

    screen.getByText('Set Temperature for Heater-Shaker Module GEN1')
    screen.getByText(
      'Set target temperature. This module actively heats but cools passively to room temperature.'
    )
    screen.getByText('Confirm')
  })

  it('renders the button and it is not clickable until there is something in form field for set temp', () => {
    props = {
      module: mockHeaterShaker,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)
    const button = screen.getByRole('button', { name: 'Confirm' })
    const input = screen.getByTestId('heaterShakerModuleV1_setTemp')
    fireEvent.change(input, { target: { value: '40' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: 'heatershaker_id',
          celsius: 40,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the exit button and when clicked, deletes the value input', () => {
    props = {
      module: mockHeaterShaker,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)
    const button = screen.getByLabelText('exit')
    const input = screen.getByTestId('heaterShakerModuleV1_setTemp')
    fireEvent.change(input, { target: { value: '40' } })
    fireEvent.click(button)

    expect(props.onCloseClick).toHaveBeenCalled()
    expect(input).not.toHaveValue()
  })
})
