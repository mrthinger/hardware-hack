import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'

import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { sessionsEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.deleteSession(robotName, Fixtures.mockSessionId)

describe('deleteSessionEpic', () => {
  const expectedRequest = {
    method: 'DELETE',
    path: `/sessions/${Fixtures.mockSessionId}`,
  }

  it('calls DELETE /sessions/{id}', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
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

  it('maps successful response to DELETE_SESSION_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.deleteSessionSuccess(
          mocks.robot.name,
          Fixtures.mockDeleteSessionSuccess.body,
          { ...mocks.meta, response: Fixtures.mockDeleteSessionSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to DELETE_SESSION_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockDeleteSessionFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = sessionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.deleteSessionFailure(
          mocks.robot.name,
          Fixtures.mockSessionId,
          { errors: [{ status: 'went bad' }] },
          { ...mocks.meta, response: Fixtures.mockDeleteSessionFailureMeta }
        ),
      })
    })
  })
})
