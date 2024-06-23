import { ofType } from 'redux-observable'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { UpdateLightsAction } from '../types'
import type { RobotApiRequestMeta } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<UpdateLightsAction> = action => ({
  method: POST,
  path: Constants.LIGHTS_PATH,
  body: { on: action.payload.lightsOn },
})

const mapResponseToAction: ResponseToActionMapper<UpdateLightsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta: RobotApiRequestMeta = {
    ...originalAction.meta,
    response: responseMeta,
  }

  return response.ok
    ? Actions.updateLightsSuccess(host.name, body.on as boolean, meta)
    : Actions.updateLightsFailure(host.name, body as { message: string }, meta)
}

export const updateLightsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, UpdateLightsAction>(Constants.UPDATE_LIGHTS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
