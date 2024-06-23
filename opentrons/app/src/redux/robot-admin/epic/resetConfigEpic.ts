import { ofType } from 'redux-observable'
import { map } from 'rxjs/operators'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Constants from '../constants'
import * as Actions from '../actions'

import type { Epic, Action } from '../../types'
import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type {
  ResetConfigAction,
  ResetConfigSuccessAction,
  RestartRobotAction,
} from '../types'

const mapActionToRequest: ActionToRequestMapper<ResetConfigAction> = action => ({
  method: POST,
  path: Constants.RESET_CONFIG_PATH,
  body: action.payload.resets,
})

const mapResponseToAction: ResponseToActionMapper<ResetConfigAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.resetConfigSuccess(host.name, meta)
    : Actions.resetConfigFailure(
        host.name,
        body as Record<string, unknown>,
        meta
      )
}

export const resetConfigEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, ResetConfigAction>(Constants.RESET_CONFIG),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

export const restartOnResetConfigEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, ResetConfigSuccessAction>(Constants.RESET_CONFIG_SUCCESS),
    map<ResetConfigSuccessAction, RestartRobotAction>(a => {
      return Actions.restartRobot(a.payload.robotName)
    })
  )
}
