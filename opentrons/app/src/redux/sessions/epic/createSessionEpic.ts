import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  RobotApiRequestOptions,
  RobotApiResponse,
  RobotApiV2ErrorResponseBody,
} from '../../robot-api/types'
import type {
  CreateSessionAction,
  EnsureSessionAction,
  SessionResponse,
} from '../types'

export const mapActionToRequest = (
  action: CreateSessionAction | EnsureSessionAction
): RobotApiRequestOptions => ({
  method: POST,
  path: Constants.SESSIONS_PATH,
  body: {
    data: {
      sessionType: action.payload.sessionType,
      createParams: action.payload.params,
    },
  },
})

export const mapResponseToAction = (
  response: RobotApiResponse,
  originalAction: CreateSessionAction | EnsureSessionAction
): Action => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.createSessionSuccess(host.name, body as SessionResponse, meta)
    : Actions.createSessionFailure(
        host.name,
        body as RobotApiV2ErrorResponseBody,
        meta
      )
}

export const createSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, CreateSessionAction>(Constants.CREATE_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
