import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
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
  FetchAllSessionsAction,
  EnsureSessionAction,
  MultiSessionResponse,
} from '../types'

export const mapActionToRequest = (): RobotApiRequestOptions => ({
  method: GET,
  path: Constants.SESSIONS_PATH,
})

export const mapResponseToAction = (
  response: RobotApiResponse,
  originalAction: FetchAllSessionsAction | EnsureSessionAction
): Action => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchAllSessionsSuccess(
        host.name,
        body as MultiSessionResponse,
        meta
      )
    : Actions.fetchAllSessionsFailure(
        host.name,
        body as RobotApiV2ErrorResponseBody,
        meta
      )
}

export const fetchAllSessionsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchAllSessionsAction>(Constants.FETCH_ALL_SESSIONS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
