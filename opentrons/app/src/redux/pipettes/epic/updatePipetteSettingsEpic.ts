import { ofType } from 'redux-observable'
import mapValues from 'lodash/mapValues'

import { PATCH } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type {
  PipetteSettingsFieldsMap,
  UpdatePipetteSettingsAction,
} from '../types'

const mapActionToRequest: ActionToRequestMapper<UpdatePipetteSettingsAction> = action => ({
  method: PATCH,
  path: `${Constants.PIPETTE_SETTINGS_PATH}/${action.payload.pipetteId}`,
  body: {
    fields: mapValues(action.payload.fields, (value: number | null) => {
      return value !== null ? { value } : value
    }),
  },
})

const mapResponseToAction: ResponseToActionMapper<UpdatePipetteSettingsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const { pipetteId } = originalAction.payload
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.updatePipetteSettingsSuccess(
        host.name,
        pipetteId,
        body.fields as PipetteSettingsFieldsMap,
        meta
      )
    : Actions.updatePipetteSettingsFailure(
        host.name,
        pipetteId,
        body as Record<string, unknown>,
        meta
      )
}

export const updatePipetteSettingsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, UpdatePipetteSettingsAction>(
      Constants.UPDATE_PIPETTE_SETTINGS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
