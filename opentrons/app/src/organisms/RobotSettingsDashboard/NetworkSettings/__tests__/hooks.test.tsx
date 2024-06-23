import * as React from 'react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import {
  getIsOnDevice,
  getOnDeviceDisplaySettings,
} from '../../../../redux/config'
import { useIsUnboxingFlowOngoing } from '../hooks'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

vi.mock('../../../../redux/config')

const store: Store<State> = createStore(vi.fn(), {})

const mockDisplaySettings = {
  sleepMs: 604800000,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
}

describe('useIsUnboxingFlowOngoing', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockDisplaySettings)
    vi.mocked(getIsOnDevice).mockReturnValue(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /welcome', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/welcome',
    })
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /emergency-stop', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/emergency-stop',
    })
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('should return false if unfinishedUnboxingFlowRoute is null', () => {
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })
})
