import * as React from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { waitFor, renderHook } from '@testing-library/react'

import { useTrackProtocolRunEvent } from '../useTrackProtocolRunEvent'
import { useProtocolRunAnalyticsData } from '../useProtocolRunAnalyticsData'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_RUN_ACTION,
} from '../../../../redux/analytics'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { useRobot } from '../useRobot'

import type { Store } from 'redux'
import type { Mock } from 'vitest'

vi.mock('../useRobot')
vi.mock('../useProtocolRunAnalyticsData')
vi.mock('../../../../redux/discovery')
vi.mock('../../../../redux/pipettes')
vi.mock('../../../../redux/analytics')
vi.mock('../../../../redux/robot-settings')

const RUN_ID = 'runId'
const ROBOT_NAME = 'otie'
const PROTOCOL_PROPERTIES = { protocolType: 'python' }

let mockTrackEvent: Mock
let mockGetProtocolRunAnalyticsData: Mock
let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(vi.fn(), {})

describe('useTrackProtocolRunEvent hook', () => {
  beforeEach(() => {
    store = createStore(vi.fn(), {})
    store.dispatch = vi.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockTrackEvent = vi.fn()
    mockGetProtocolRunAnalyticsData = vi.fn(
      () =>
        new Promise(resolve =>
          resolve({ protocolRunAnalyticsData: PROTOCOL_PROPERTIES })
        )
    )
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)

    when(vi.mocked(useProtocolRunAnalyticsData))
      .calledWith(RUN_ID, mockConnectableRobot)
      .thenReturn({
        getProtocolRunAnalyticsData: mockGetProtocolRunAnalyticsData,
      })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns trackProtocolRunEvent function', () => {
    const { result } = renderHook(
      () => useTrackProtocolRunEvent(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    expect(typeof result.current.trackProtocolRunEvent).toBe('function')
  })

  it('trackProtocolRunEvent invokes trackEvent with correct props', async () => {
    const { result } = renderHook(
      () => useTrackProtocolRunEvent(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: PROTOCOL_PROPERTIES,
    })
  })

  it('trackProtocolRunEvent calls trackEvent without props when error is thrown in getProtocolRunAnalyticsData', async () => {
    when(vi.mocked(useProtocolRunAnalyticsData))
      .calledWith('errorId', mockConnectableRobot)
      .thenReturn({
        getProtocolRunAnalyticsData: () =>
          new Promise(() => {
            throw new Error('error')
          }),
      })
    const { result } = renderHook(
      () => useTrackProtocolRunEvent('errorId', ROBOT_NAME),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {},
    })
  })
})
