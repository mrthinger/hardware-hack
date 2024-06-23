import * as React from 'react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { renderHook } from '@testing-library/react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { useRobot } from '../'
import { useRobotAnalyticsData } from '../useRobotAnalyticsData'
import { getAttachedPipettes } from '../../../../redux/pipettes'
import { getRobotSettings } from '../../../../redux/robot-settings'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'

import {
  getRobotApiVersion,
  getRobotFirmwareVersion,
  getRobotSerialNumber,
} from '../../../../redux/discovery'

import type { Store } from 'redux'
import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'

vi.mock('@opentrons/react-api-client')
vi.mock('../../hooks')
vi.mock('../../../../redux/discovery')
vi.mock('../../../../redux/pipettes')
vi.mock('../../../../redux/robot-settings')

const ROBOT_SETTINGS = [
  { id: `setting1`, value: true, title: '', description: '' },
  { id: `setting2`, value: false, title: '', description: '' },
]
const ROBOT_VERSION = 'version1'
const ROBOT_FIRMWARE_VERSION = 'firmwareVersion1'
const ATTACHED_PIPETTES = {
  left: { id: '1', model: 'testModelLeft' },
  right: { id: '2', model: 'testModelRight' },
}
const ROBOT_SERIAL_NUMBER = 'OT123'

let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(vi.fn(), {})

describe('useProtocolAnalysisErrors hook', () => {
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
    when(vi.mocked(useRobot)).calledWith('noRobot').thenReturn(null)
    vi.mocked(getRobotApiVersion).mockReturnValue(ROBOT_VERSION)
    vi.mocked(getRobotSettings).mockReturnValue(ROBOT_SETTINGS)
    vi.mocked(getRobotFirmwareVersion).mockReturnValue(ROBOT_FIRMWARE_VERSION)
    vi.mocked(getAttachedPipettes).mockReturnValue(
      ATTACHED_PIPETTES as AttachedPipettesByMount
    )
    vi.mocked(getRobotSerialNumber).mockReturnValue(ROBOT_SERIAL_NUMBER)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns null when robot is null or undefined', () => {
    const { result } = renderHook(() => useRobotAnalyticsData('noRobot'), {
      wrapper,
    })
    expect(result.current).toStrictEqual(null)
  })

  it('returns robot analytics data when robot exists', () => {
    when(vi.mocked(useRobot))
      .calledWith('otie')
      .thenReturn({
        ...mockConnectableRobot,
        health: {
          ...mockConnectableRobot.health,
          robot_serial: ROBOT_SERIAL_NUMBER,
        },
      } as DiscoveredRobot)

    const { result } = renderHook(() => useRobotAnalyticsData('otie'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      robotApiServerVersion: ROBOT_VERSION,
      robotFF_setting1: true,
      robotFF_setting2: false,
      robotLeftPipette: 'testModelLeft',
      robotRightPipette: 'testModelRight',
      robotSmoothieVersion: ROBOT_FIRMWARE_VERSION,
      robotSerialNumber: ROBOT_SERIAL_NUMBER,
    })
  })
})
