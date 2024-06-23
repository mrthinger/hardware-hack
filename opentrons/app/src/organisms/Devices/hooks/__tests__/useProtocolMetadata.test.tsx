// tests for the HostConfig context and hook
import * as React from 'react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react'
import { useCurrentProtocol } from '../../../ProtocolUpload/hooks'
import { useProtocolMetadata } from '../useProtocolMetadata'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

vi.mock('../../../ProtocolUpload/hooks')

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(vi.fn(), {})

  when(vi.mocked(useCurrentProtocol))
    .calledWith()
    .thenReturn({
      data: {
        protocolType: 'json',
        robotType: 'OT-3 Standard',
        metadata: {
          author: 'AUTHOR',
          description: 'DESCRIPTION',
          lastModified: 123456,
        },
      },
    } as any)

  beforeEach(() => {
    store.dispatch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return author, lastUpdated, method, description, and robot type', () => {
    const wrapper: React.FunctionComponent<{ children: React.ReactNode }> = ({
      children,
    }) => <Provider store={store}>{children}</Provider>
    const { result } = renderHook(useProtocolMetadata, { wrapper })
    const {
      author,
      lastUpdated,
      creationMethod,
      description,
      robotType,
    } = result.current

    expect(author).toBe('AUTHOR')
    expect(lastUpdated).toBe(123456)
    expect(creationMethod).toBe('json')
    expect(description).toBe('DESCRIPTION')
    expect(robotType).toBe('OT-3 Standard')
  })
})
