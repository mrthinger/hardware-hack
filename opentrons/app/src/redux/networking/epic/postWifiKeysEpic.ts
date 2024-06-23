import { ofType } from 'redux-observable'
import omit from 'lodash/omit'

import { POST } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import { postWifiKeysSuccess, postWifiKeysFailure } from '../actions'
import { POST_WIFI_KEYS, WIFI_KEYS_PATH } from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { PostWifiKeysAction, WifiKey } from '../types'
import type { RobotApiErrorResponse } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<PostWifiKeysAction> = action => {
  const { keyFile } = action.payload
  const form = new FormData()
  form.append('key', keyFile, keyFile.name)

  return { method: POST, path: WIFI_KEYS_PATH, form }
}

const mapResponseToAction: ResponseToActionMapper<PostWifiKeysAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? postWifiKeysSuccess(host.name, omit(body, 'message') as WifiKey, meta)
    : postWifiKeysFailure(host.name, body as RobotApiErrorResponse, meta)
}

export const postWifiKeysEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, PostWifiKeysAction>(POST_WIFI_KEYS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
