import { vi, describe, it, expect, beforeEach } from 'vitest'

import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import { pipettesEpic } from '../../epic'

import type * as Types from '../../types'
import type { Action, State } from '../../../types'
import type { RobotApiResponse } from '../../../robot-api/types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

describe('fetchPipettesEpic', () => {
  let testScheduler: TestScheduler

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  describe('handles FETCH_PIPETTES', () => {
    const meta = { requestId: '1234' } as any
    const action: Types.FetchPipettesAction = {
      ...Actions.fetchPipettes(mockRobot.name, true),
      meta,
    }

    it('calls GET /pipettes', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
          cold<RobotApiResponse>('r', { r: Fixtures.mockFetchPipettesSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: mockState })
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$)
        flush()

        expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
        expect(vi.mocked(RobotApiHttp.fetchRobotApi)).toHaveBeenCalledWith(
          mockRobot,
          {
            method: 'GET',
            path: '/pipettes',
            query: { refresh: true },
          }
        )
      })
    })

    it('maps successful response to FETCH_PIPETTES_SUCCESS', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipettesSuccess })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipettesSuccess(
            mockRobot.name,
            Fixtures.mockFetchPipettesSuccess.body,
            { ...meta, response: Fixtures.mockFetchPipettesSuccessMeta }
          ),
        })
      })
    })

    it('maps failed response to FETCH_PIPETTES_FAILURE', () => {
      testScheduler.run(({ hot, cold, expectObservable, flush }) => {
        vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
          cold('r', { r: Fixtures.mockFetchPipettesFailure })
        )

        const action$ = hot<Action>('--a', { a: action })
        const state$ = hot<State>('a-a', { a: {} } as any)
        const output$ = pipettesEpic(action$, state$)

        expectObservable(output$).toBe('--a', {
          a: Actions.fetchPipettesFailure(
            mockRobot.name,
            { message: 'AH' },
            { ...meta, response: Fixtures.mockFetchPipettesFailureMeta }
          ),
        })
      })
    })
  })
})
