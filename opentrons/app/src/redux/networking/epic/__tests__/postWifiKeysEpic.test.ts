import { describe, it, expect } from 'vitest'

import { setupEpicTestMocks, runEpicTest } from '../../../robot-api/__utils__'
import * as Fixtures from '../../__fixtures__'
import * as Actions from '../../actions'
import { networkingEpic } from '..'

import type { Action } from '../../../types'

const keyFile = new File([Buffer.from('contents')], 'key.crt')
const makeTriggerAction = (robotName: string) =>
  Actions.postWifiKeys(robotName, keyFile)

describe('networking post wifi keys epic', () => {
  it('calls POST /wifi/keys', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockPostWifiKeysSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable, flush }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$)
      flush()

      const expectedForm = new FormData()
      expectedForm.append('key', keyFile, 'key.crt')

      expect(mocks.fetchRobotApi).toHaveBeenCalledWith(mocks.robot, {
        method: 'POST',
        path: '/wifi/keys',
        form: expectedForm,
      })
    })
  })

  it('maps successful response to POST_WIFI_KEYS_SUCCESS', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockPostWifiKeysSuccess
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiKeysSuccess(mocks.robot.name, Fixtures.mockWifiKey, {
          ...mocks.meta,
          response: Fixtures.mockPostWifiKeysSuccessMeta,
        }),
      })
    })
  })

  it('maps failed response to POST_WIFI_KEYS_FAILURE', () => {
    const mocks = setupEpicTestMocks(
      makeTriggerAction,
      Fixtures.mockPostWifiKeysFailure
    )

    runEpicTest<Action>(mocks, ({ hot, expectObservable }) => {
      const action$ = hot('--a', { a: mocks.action })
      const state$ = hot('s-s', { s: mocks.state })
      const output$ = networkingEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.postWifiKeysFailure(
          mocks.robot.name,
          Fixtures.mockPostWifiKeysFailure.body,
          { ...mocks.meta, response: Fixtures.mockPostWifiKeysFailureMeta }
        ),
      })
    })
  })
})
