import { ofType } from 'redux-observable'
import { filter, map, switchMap, ignoreElements } from 'rxjs/operators'
import { parseISO, differenceInSeconds } from 'date-fns'

import { GET, PUT, fetchRobotApi } from '../../robot-api'
import { withRobotHost } from '../../robot-api/operators'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'
import type {
  RobotApiRequestOptions,
  RobotApiResponse,
} from '../../robot-api/types'
import type { SyncSystemTimeAction } from '../types'
import type { OperatorFunction } from 'rxjs'

const SYNC_THRESHOLD_SEC = 60

const mapActionToFetchRequest = (
  action: SyncSystemTimeAction
): RobotApiRequestOptions => {
  return { method: GET, path: Constants.SYSTEM_TIME_PATH }
}

const createUpdateRequest = (date: Date): RobotApiRequestOptions => {
  return {
    method: PUT,
    path: Constants.SYSTEM_TIME_PATH,
    body: {
      data: {
        systemTime: date.toISOString(),
      },
    },
  }
}

export const syncSystemTimeEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, SyncSystemTimeAction>(Constants.SYNC_SYSTEM_TIME),
    withRobotHost(state$, action => action.payload.robotName),
    // TODO(mc, 2020-09-08): only fetch if health.links.systemTime exists,
    // see TODO in robot-server/robot_server/service/legacy/models/health.py
    switchMap(([action, state, robot]) => {
      const fetchSystemTimeReq = mapActionToFetchRequest(action)

      return fetchRobotApi(robot, fetchSystemTimeReq).pipe(
        filter(response => response.ok),
        map(response => response.body.data.systemTime),
        filter(systemTimeString => {
          const systemTime = parseISO(systemTimeString as string)
          const drift = differenceInSeconds(systemTime, new Date())
          return Math.abs(drift) > SYNC_THRESHOLD_SEC
        }),
        switchMap(() => {
          const updateSystemTimeReq = createUpdateRequest(new Date())
          return fetchRobotApi(robot, updateSystemTimeReq)
        })
      )
    }),
    ignoreElements() as OperatorFunction<RobotApiResponse, Action>
  )
}
