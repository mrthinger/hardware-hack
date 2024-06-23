import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { RobotSystemVersionModal } from '../RobotSystemVersionModal'
import type * as Dom from 'react-router-dom'

const mockFn = vi.fn()
const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof Dom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (
  props: React.ComponentProps<typeof RobotSystemVersionModal>
) => {
  return renderWithProviders(<RobotSystemVersionModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSystemVersionModal', () => {
  let props: React.ComponentProps<typeof RobotSystemVersionModal>

  beforeEach(() => {
    props = {
      version: 'mockVersion',
      releaseNotes: 'mockReleaseNote',
      setShowModal: mockFn,
    }
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Robot System Version mockVersion available')
    screen.getByText(
      'Updating the robot software requires restarting the robot'
    )
    screen.getByText('mockReleaseNote')
    screen.getByText('Not now')
    screen.getByText('Update')
  })

  it('should close the modal when tapping remind me later', () => {
    render(props)
    fireEvent.click(screen.getByText('Update'))
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/update-robot')
  })

  it('should call the mock function when tapping update', () => {
    render(props)
    fireEvent.click(screen.getByText('Not now'))
    expect(mockFn).toHaveBeenCalled()
  })
})
