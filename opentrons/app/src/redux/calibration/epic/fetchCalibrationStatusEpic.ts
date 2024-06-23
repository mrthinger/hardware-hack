import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import * as Actions from '../actions'
import * as Constants from '../constants'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'
import type { Action, Epic } from '../../types'
import type { CalibrationStatus, FetchCalibrationStatusAction } from '../types'
import type { RobotApiErrorResponse } from '../../robot-api/types'

const mapActionToRequest: ActionToRequestMapper<FetchCalibrationStatusAction> = action => ({
  method: GET,
  path: Constants.CALIBRATION_STATUS_PATH,
})

const mapResponseToAction: ResponseToActionMapper<FetchCalibrationStatusAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }

  return response.ok
    ? Actions.fetchCalibrationStatusSuccess(
        host.name,
        body as CalibrationStatus,
        meta
      )
    : Actions.fetchCalibrationStatusFailure(
        host.name,
        body as RobotApiErrorResponse,
        meta
      )
}

export const fetchCalibrationStatusEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchCalibrationStatusAction>(
      Constants.FETCH_CALIBRATION_STATUS
    ),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
