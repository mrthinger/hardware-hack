import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { calibrationEpic } from '..'

import type { Action } from '../../../types'

const makeTriggerAction = (robotName: string) =>
  Actions.fetchCalibrationStatus(robotName)

describe('fetch calibration status epic', () => {
  it('calls GET /calibration/status', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchCalibrationStatusSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = calibrationEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'GET',
        path: '/calibration/status',
      })
    })
  })

  it('maps successful response to FETCH_CALIBRATION_STATUS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchCalibrationStatusSuccess
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = calibrationEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchCalibrationStatusSuccess(
          mocks.robot.name,
          Fixtures.mockFetchCalibrationStatusSuccess.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchCalibrationStatusSuccessMeta,
          }
        ),
      })
    })
  })

  it('maps failed response to FETCH_CALIBRATION_STATUS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockFetchCalibrationStatusFailure
    )

    runEpicTest(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = calibrationEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.fetchCalibrationStatusFailure(
          mocks.robot.name,
          Fixtures.mockFetchCalibrationStatusFailure.body,
          {
            ...mocks.meta,
            response: Fixtures.mockFetchCalibrationStatusFailureMeta,
          }
        ),
      })
    })
  })
})
