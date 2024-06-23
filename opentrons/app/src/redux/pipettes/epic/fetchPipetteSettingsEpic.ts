import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchPipetteSettingsAction, PipetteSettings } from '../types'

const mapActionToRequest: ActionToRequestMapper<FetchPipetteSettingsAction> = action => ({
  method: GET,
  path: Constants.PIPETTE_SETTINGS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchPipetteSettingsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchPipetteSettingsSuccess(
        host.name,
        body as Record<string, PipetteSettings>,
        meta
      )
    : Actions.fetchPipetteSettingsFailure(
        host.name,
        body as Record<string, unknown>,
        meta
      )
}

export const fetchPipetteSettingsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchPipetteSettingsAction>(
      Constants.FETCH_PIPETTE_SETTINGS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
