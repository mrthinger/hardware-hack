import { ofType } from 'redux-observable'

import { GET } from '../../../robot-api/constants'
import { mapToRobotApiRequest } from '../../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../../robot-api/operators'
import type { Action, Epic } from '../../../types'
import type { FetchPipetteOffsetCalibrationsAction } from '../types'
import type { AllPipetteOffsetCalibrations } from '../../api-types'
import type { RobotApiErrorResponse } from '../../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<FetchPipetteOffsetCalibrationsAction> = action => ({
  method: GET,
  path: Constants.PIPETTE_OFFSET_CALIBRATIONS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchPipetteOffsetCalibrationsAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchPipetteOffsetCalibrationsSuccess(
        host.name,
        body as AllPipetteOffsetCalibrations,
        meta
      )
    : Actions.fetchPipetteOffsetCalibrationsFailure(
        host.name,
        body as RobotApiErrorResponse,
        meta
      )
}

export const fetchPipetteOffsetCalibrationsEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchPipetteOffsetCalibrationsAction>(
      Constants.FETCH_PIPETTE_OFFSET_CALIBRATIONS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
