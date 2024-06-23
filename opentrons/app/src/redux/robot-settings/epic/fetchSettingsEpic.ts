import { ofType } from 'redux-observable'

import { GET } from '../../robot-api'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchSettingsAction, RobotSettings } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchSettingsAction> = () => ({
  method: GET,
  path: Constants.SETTINGS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchSettingsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchSettingsSuccess(
        host.name,
        body.settings as RobotSettings,
        (body.links?.restart as string | null) ?? null,
        meta
      )
    : Actions.fetchSettingsFailure(host.name, body as { message: string }, meta)
}

export const fetchSettingsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchSettingsAction>(Constants.FETCH_SETTINGS),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
