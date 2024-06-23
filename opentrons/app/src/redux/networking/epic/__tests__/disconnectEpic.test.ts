import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.postWifiDisconnect(robotName, 'network-name')

describe('networking disconnectEpic', () => {
  it('calls POST /wifi/disconnect', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/wifi/disconnect',
        body: Fixtures.mockNetworkingDisconnect,
      })
    })
  })

  it('maps successful response to POST_DISCONNECT_NETWORK_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiDisconnectSuccess(mocks.robot.name, {
          ...mocks.meta,
          response: Fixtures.mockNetworkingDisconnectSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to POST_DISCONNECT_NETWORK_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingDisconnectFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiDisconnectFailure(
          mocks.robot.name,
          Fixtures.mockNetworkingDisconnectFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockNetworkingDisconnectFailureMeta,
          }
        ),
      })
    })
  })
})
