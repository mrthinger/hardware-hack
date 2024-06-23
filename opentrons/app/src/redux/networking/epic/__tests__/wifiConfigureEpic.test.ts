import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Discovery from '../../../discovery'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.postWifiConfigure(robotName, {
    ssid: 'network-name',
    psk: 'network-password',
  })

describe('networking wifiConfigureEpic', () => {
  it('calls POST /wifi/configure with options', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiConfigureSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/wifi/configure',
        body: { ssid: 'network-name', psk: 'network-password' },
      })
    })
  })

  it('maps successful response to FETCH_WIFI_CONFIGURE_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiConfigureSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiConfigureSuccess(
          mocks.robot.name,
          Fixtures.mockWifiConfigureSuccess.body.ssid,
          { ...mocks.meta, response: Fixtures.mockWifiConfigureSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_WIFI_CONFIGURE_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockWifiConfigureFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiConfigureFailure(
          mocks.robot.name,
          Fixtures.mockWifiConfigureFailure.body,
          { ...mocks.meta, response: Fixtures.mockWifiConfigureFailureMeta }
        ),
      })
    })
  })

  it('dispatches FETCH_WIFI_LIST and START_DISCOVERY on success', () => {
    const mocks = setupEpicTestMocks(robotName =>
      Actions.postWifiConfigureSuccess(robotName, 'network-name', {} as any)
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--(a)', {
        a: Discovery.startDiscovery(),
      })
    })
  })
})
