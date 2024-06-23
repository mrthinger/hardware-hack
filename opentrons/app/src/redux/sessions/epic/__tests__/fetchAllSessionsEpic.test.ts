import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'
import { mockRobot } from '../../../robot-api/__fixtures__'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.fetchAllSessions(robotName)

describe('fetchAllSessionsEpic', () => {
  const expectedRequest = {
    method: 'GET',
    path: '/sessions',
  }

  it('calls GET /sessions', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, cold, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(
        mocks.robot,
        expectedRequest
      )
    })
  })

  it('maps successful response to FETCH_ALL_SESSIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsSuccess(
          mockRobot.name,
          Fixtures.mockFetchAllSessionsSuccess.body,
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_ALL_SESSIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchAllSessionsFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchAllSessionsFailure(
          mocks.robot.name,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockFetchAllSessionsFailureMeta }
        ),
      })
    })
  })
})
