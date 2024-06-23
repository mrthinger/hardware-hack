import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ResetValuesModal } from '../ResetValuesModal'
import type { RunTimeParameter } from '@opentrons/shared-data'

const mockGoBack = vi.fn()
const mockSetRunTimeParametersOverrides = vi.fn()

const render = (props: React.ComponentProps<typeof ResetValuesModal>) => {
  return renderWithProviders(<ResetValuesModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ResetValuesModal', () => {
  let props: React.ComponentProps<typeof ResetValuesModal>

  beforeEach(() => {
    props = {
      runTimeParametersOverrides: [] as RunTimeParameter[],
      setRunTimeParametersOverrides: mockSetRunTimeParametersOverrides,
      handleGoBack: mockGoBack,
    }
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Reset parameter values?')
    screen.getByText(
      'This will discard any changes you have made. All parameters will have their default values.'
    )

    screen.getByText('Go back')
    screen.getByText('Reset values')
  })

  it('should call a mock function when tapping go back button', () => {
    render(props)
    const goBackButton = screen.getByText('Go back')
    fireEvent.click(goBackButton)
    expect(mockGoBack).toHaveBeenCalled()
  })

  // ToDo (kk: 03/18/2024) reset value button test will be added
  it('should call a mock function when tapping reset values button', () => {
    render(props)
    const resetValuesButton = screen.getByText('Reset values')
    fireEvent.click(resetValuesButton)
    expect(mockSetRunTimeParametersOverrides)
    expect(mockGoBack).toHaveBeenCalled()
  })
})
