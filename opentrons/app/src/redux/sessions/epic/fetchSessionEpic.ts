import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type { ResponseToActionMapper } from '../../robot-api/operators'
import type {
  RobotApiRequestOptions,
  RobotApiV2ErrorResponseBody,
} from '../../robot-api/types'

import type {
  FetchSessionAction,
  CreateSessionCommandAction,
  SessionResponse,
} from '../types'

export const mapActionToRequest = (
  action: FetchSessionAction | CreateSessionCommandAction
): RobotApiRequestOptions => ({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/${action.payload.sessionId}`,
})

const mapResponseToAction: ResponseToActionMapper<FetchSessionAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchSessionSuccess(host.name, body as SessionResponse, meta)
    : Actions.fetchSessionFailure(
        host.name,
        originalAction.payload.sessionId,
        body as RobotApiV2ErrorResponseBody,
        meta
      )
}

export const fetchSessionEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchSessionAction>(Constants.FETCH_SESSION),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
