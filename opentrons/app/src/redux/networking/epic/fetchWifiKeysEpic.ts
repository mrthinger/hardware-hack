import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { fetchWifiKeysSuccess, fetchWifiKeysFailure } from '../actions'
import { FETCH_WIFI_KEYS, WIFI_KEYS_PATH } from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { ApiWifiKey, FetchWifiKeysAction } from '../types'
import type { RobotApiErrorResponse } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<FetchWifiKeysAction> = action => ({
  method: GET,
  path: WIFI_KEYS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchWifiKeysAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? fetchWifiKeysSuccess(host.name, body.keys as ApiWifiKey[], meta)
    : fetchWifiKeysFailure(host.name, body as RobotApiErrorResponse, meta)
}

export const fetchWifiKeysEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchWifiKeysAction>(FETCH_WIFI_KEYS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
