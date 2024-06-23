import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { NameQuickTransfer } from '../NameQuickTransfer'
import type { InputField } from '../../../atoms/InputField'

vi.mock('../utils')

vi.mock('../../../atoms/InputField', async importOriginal => {
  const actualComponents = await importOriginal<typeof InputField>()
  return {
    ...actualComponents,
    InputField: vi.fn(),
  }
})

const render = (props: React.ComponentProps<typeof NameQuickTransfer>) => {
  return renderWithProviders(<NameQuickTransfer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('NameQuickTransfer', () => {
  let props: React.ComponentProps<typeof NameQuickTransfer>

  beforeEach(() => {
    props = {
      onSave: vi.fn(),
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the name entry screen, save button, and keyboard', () => {
    render(props)
    screen.getByText('Name your quick transfer')
    screen.getByText('Save')
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
    screen.getByText('Enter up to 60 characters')
  })

  it('renders the keyboard buttons and enables save if you press one', () => {
    render(props)
    const wKey = screen.getByText('w')
    fireEvent.click(wKey)
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeEnabled()
    fireEvent.click(saveBtn)
    expect(props.onSave).toHaveBeenCalled()
  })

  it('disables save if you enter more than 60 characters', () => {
    render(props)
    const wKey = screen.getByText('w')
    for (let i = 0; i < 61; i++) {
      fireEvent.click(wKey)
    }
    const saveBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(saveBtn).toBeDisabled()
    screen.getByText('Character limit exceeded')
  })
})
