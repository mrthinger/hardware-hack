import * as React from 'react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'

import { getDiscoverableRobotByName } from '../../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { useIsRobotViewable } from '..'
import type { Store } from 'redux'

vi.mock('../../../../redux/discovery')

const store: Store<any> = createStore(vi.fn(), {})

describe('useIsRobotViewable hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns false when given an unreachable robot name', () => {
    when(vi.mocked(getDiscoverableRobotByName))
      .calledWith(undefined as any, 'otie')
      .thenReturn(mockUnreachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), { wrapper })

    expect(result.current).toEqual(false)
  })

  it('returns false when given a reachable robot name', () => {
    when(vi.mocked(getDiscoverableRobotByName))
      .calledWith(undefined as any, 'otie')
      .thenReturn(mockReachableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(false)
  })

  it('returns true when given a connectable robot name', () => {
    when(vi.mocked(getDiscoverableRobotByName))
      .calledWith(undefined as any, 'otie')
      .thenReturn(mockConnectableRobot)

    const { result } = renderHook(() => useIsRobotViewable('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(true)
  })
})
