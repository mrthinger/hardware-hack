import { of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import { switchMap } from 'rxjs/operators'

import { startDiscovery } from '../../discovery'
import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type {
  PostWifiConfigureAction,
  PostWifiConfigureSuccessAction,
} from '../types'
import type { RobotApiErrorResponse } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<PostWifiConfigureAction> = action => ({
  method: POST,
  path: Constants.WIFI_CONFIGURE_PATH,
  body: action.payload.options,
})

const mapResponseToAction: ResponseToActionMapper<PostWifiConfigureAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.postWifiConfigureSuccess(host.name, body.ssid as string, meta)
    : Actions.postWifiConfigureFailure(
        host.name,
        body as RobotApiErrorResponse,
        meta
      )
}

const postWifiConfigureEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, PostWifiConfigureAction>(Constants.POST_WIFI_CONFIGURE),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}

const handleWifiConfigureSuccessEpic: Epic = action$ => {
  return action$.pipe(
    ofType<Action, PostWifiConfigureSuccessAction>(
      Constants.POST_WIFI_CONFIGURE_SUCCESS
    ),
    switchMap(() => of(startDiscovery()))
  )
}

export const wifiConfigureEpic: Epic = combineEpics<Epic>(
  postWifiConfigureEpic,
  handleWifiConfigureSuccessEpic
)
