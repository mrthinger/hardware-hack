import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) => Actions.fetchStatus(robotName)

describe('networking statusEpic', () => {
  it('calls GET /networking/status', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingStatusSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/networking/status',
      })
    })
  })

  it('maps successful response to FETCH_STATUS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingStatusSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchStatusSuccess(
          mocks.robot.name,
          Fixtures.mockNetworkingStatusSuccess.body.status,
          Fixtures.mockNetworkingStatusSuccess.body.interfaces,
          {
            ...mocks.meta,
            response: Fixtures.mockNetworkingStatusSuccessMeta,
          }
        ),
      })
    })
  })

  it('maps failed response to FETCH_STATUS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockNetworkingStatusFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchStatusFailure(
          mocks.robot.name,
          Fixtures.mockNetworkingStatusFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockNetworkingStatusFailureMeta,
          }
        ),
      })
    })
  })
})
