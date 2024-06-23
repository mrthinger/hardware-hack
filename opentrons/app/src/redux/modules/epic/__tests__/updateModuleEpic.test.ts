import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TestScheduler } from 'rxjs/testing'

import * as RobotApiHttp from '../../../robot-api/http'
import * as DiscoverySelectors from '../../../discovery/selectors'
import * as Fixtures from '../../__fixtures__'

import * as Actions from '../../actions'
import { modulesEpic } from '../../epic'

import type * as Types from '../../types'
import type { Action, State } from '../../../types'

vi.mock('../../../robot-api/http')
vi.mock('../../../discovery/selectors')

const mockState: State = { state: true } as any
const { mockRobot } = Fixtures

describe('updateModuleEpic', () => {
  let testScheduler: TestScheduler

  const meta = { requestId: '1234' }
  const action: Types.UpdateModuleAction = {
    ...Actions.updateModule(mockRobot.name, 'abc123'),
    meta,
  }

  beforeEach(() => {
    vi.mocked(DiscoverySelectors.getRobotByName).mockReturnValue(
      mockRobot as any
    )

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('calls POST /modules/{serial}/update', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: mockState })
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$)
      flush()

      expect(DiscoverySelectors.getRobotByName).toHaveBeenCalledWith(
        mockState,
        mockRobot.name
      )
      expect(RobotApiHttp.fetchRobotApi).toHaveBeenCalledWith(mockRobot, {
        method: 'POST',
        path: '/modules/abc123/update',
      })
    })
  })

  it('maps successful response to SEND_MODULE_COMMAND_SUCCESS', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleSuccess })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateModuleSuccess(
          mockRobot.name,
          'abc123',
          'update successful',
          { ...meta, response: Fixtures.mockUpdateModuleSuccessMeta }
        ),
      })
    })
  })

  it('maps failed response to SEND_MODULE_COMMAND_FAILURE', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      vi.mocked(RobotApiHttp.fetchRobotApi).mockReturnValue(
        cold('r', { r: Fixtures.mockUpdateModuleFailure })
      )

      const action$ = hot<Action>('--a', { a: action })
      const state$ = hot<State>('a-a', { a: {} } as any)
      const output$ = modulesEpic(action$, state$)

      expectObservable(output$).toBe('--a', {
        a: Actions.updateModuleFailure(
          mockRobot.name,
          'abc123',
          { message: 'BAD NEWS BEARS' },
          { ...meta, response: Fixtures.mockUpdateModuleFailureMeta }
        ),
      })
    })
  })
})
