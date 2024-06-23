import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { fetchResetOptionsEpic } from '../fetchResetOptionsEpic'

import type { Action } from '../../../types'

describe('robotAdminEpic handles fetching "factory reset" options', () => {
  it('calls GET /settings/reset/options on FETCH_RESET_CONFIG_OPTIONS', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.fetchResetConfigOptions(robotName),
      Fixtures.mockFetchResetOptionsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = fetchResetOptionsEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/settings/reset/options',
      })
    })
  })

  it('maps successful response to FETCH_RESET_CONFIG_OPTIONS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.fetchResetConfigOptions(robotName),
      Fixtures.mockFetchResetOptionsSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = fetchResetOptionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchResetConfigOptionsSuccess(
          mocks.robot.name,
          Fixtures.mockResetOptions,
          { ...mocks.meta, response: Fixtures.mockFetchResetOptionsSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to FETCH_RESET_CONFIG_OPTIONS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      robotName => Actions.fetchResetConfigOptions(robotName),
      Fixtures.mockFetchResetOptionsFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = fetchResetOptionsEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchResetConfigOptionsFailure(
          mocks.robot.name,
          { message: 'AH' },
          { ...mocks.meta, response: Fixtures.mockFetchResetOptionsFailureMeta }
        ),
      })
    })
  })
})
