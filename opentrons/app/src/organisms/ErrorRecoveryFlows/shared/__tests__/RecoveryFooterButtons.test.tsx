import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { RecoveryFooterButtons } from '../RecoveryFooterButtons'

import type { Mock } from 'vitest'

const render = (props: React.ComponentProps<typeof RecoveryFooterButtons>) => {
  return renderWithProviders(<RecoveryFooterButtons {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryFooterButtons', () => {
  let props: React.ComponentProps<typeof RecoveryFooterButtons>
  let mockPrimaryBtnOnClick: Mock
  let mockSecondaryBtnOnClick: Mock
  let mockTertiaryBtnOnClick: Mock

  beforeEach(() => {
    mockPrimaryBtnOnClick = vi.fn()
    mockSecondaryBtnOnClick = vi.fn()
    mockTertiaryBtnOnClick = vi.fn()
    props = {
      isOnDevice: true,
      primaryBtnOnClick: mockPrimaryBtnOnClick,
      secondaryBtnOnClick: mockSecondaryBtnOnClick,
    }
  })

  it('renders default button copy and click behavior', () => {
    render(props)

    const primaryBtn = screen.getByRole('button', { name: 'Continue' })
    const secondaryBtn = screen.getByRole('button', { name: 'Go back' })

    fireEvent.click(primaryBtn)
    fireEvent.click(secondaryBtn)

    expect(mockPrimaryBtnOnClick).toHaveBeenCalled()
    expect(mockSecondaryBtnOnClick).toHaveBeenCalled()
  })

  it('renders alternative button text when supplied', () => {
    props = { ...props, primaryBtnTextOverride: 'MOCK_OVERRIDE_TEXT' }
    render(props)

    screen.getByRole('button', { name: 'MOCK_OVERRIDE_TEXT' })
  })

  it('does not render the secondary button if no on click handler is supplied', () => {
    props = { ...props, secondaryBtnOnClick: undefined }
    render(props)

    expect(
      screen.queryByRole('button', { name: 'Go back' })
    ).not.toBeInTheDocument()
  })

  it('renders correct loading state on the primary button if loading is true', () => {
    props = { ...props, isLoadingPrimaryBtnAction: true }
    render(props)

    const primaryBtn = screen.getByRole('button', {
      name: 'loading indicator Continue',
    })

    screen.getByLabelText('loading indicator')
    expect(primaryBtn).toHaveStyle(`background-color: ${COLORS.blue60}`)
  })

  it('renders the tertiary button when tertiaryBtnOnClick is provided', () => {
    props = { ...props, tertiaryBtnOnClick: mockTertiaryBtnOnClick }
    render(props)

    const tertiaryBtn = screen.getByRole('button', { name: '' })

    fireEvent.click(tertiaryBtn)

    expect(mockTertiaryBtnOnClick).toHaveBeenCalled()
  })

  it('renders the tertiary button with custom text when tertiaryBtnText is provided', () => {
    props = { ...props, tertiaryBtnText: 'Hey' }
    render(props)

    screen.getByRole('button', { name: 'Hey' })
  })

  it('renders the tertiary button as disabled when tertiaryBtnDisabled is true', () => {
    props = {
      ...props,
      tertiaryBtnOnClick: mockTertiaryBtnOnClick,
      tertiaryBtnDisabled: true,
      tertiaryBtnText: 'Hi',
    }
    render(props)

    const tertiaryBtn = screen.getByRole('button', { name: 'Hi' })

    expect(tertiaryBtn).toBeDisabled()
  })
})
