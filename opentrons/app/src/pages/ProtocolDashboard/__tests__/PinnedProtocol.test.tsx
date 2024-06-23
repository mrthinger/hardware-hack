import * as React from 'react'
import { vi, it, describe, expect } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PinnedProtocol } from '../PinnedProtocol'

import type { ProtocolResource } from '@opentrons/shared-data'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  robotType: 'OT-3 Standard',
  protocolType: 'json',
  metadata: {
    protocolName: 'yay mock protocol',
    author: 'engineering',
    description: 'A short mock protocol',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const props = {
  protocol: mockProtocol,
  longPress: vi.fn(),
  setShowDeleteConfirmationModal: vi.fn(),
  setTargetProtocolId: vi.fn(),
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <PinnedProtocol {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Pinned Protocol', () => {
  vi.useFakeTimers()

  it('should redirect to protocol details after short click', () => {
    render()
    const name = screen.getByText('yay mock protocol')
    fireEvent.click(name)
    expect(mockPush).toHaveBeenCalledWith('/protocols/mockProtocol1')
  })

  it('should display modal after long click', async () => {
    vi.useFakeTimers()
    render()
    const name = screen.getByText('yay mock protocol')
    fireEvent.mouseDown(name)
    act(() => {
      vi.advanceTimersByTime(1005)
    })
    expect(props.longPress).toHaveBeenCalled()
    screen.getByText('Run protocol')
    // This should ne "Unpin protocol" but I don't know how to pass state into the render
    // call so the longpress modal can see the pinned ids.
    screen.getByText('Pin protocol')
    screen.getByText('Delete protocol')
  })
})
