// api request state reducer
// tracks requests by ID
// TODO(mc, 2020-03-05): caution! type checking in this file appears to
// be fairly broken; make sure you have unit tests in place when changing

import omit from 'lodash/omit'
import { PENDING, SUCCESS, FAILURE, DISMISS_REQUEST } from './constants'

import type { Action } from '../types'
import type { RobotApiState } from './types'

export function robotApiReducer(
  state: RobotApiState = {},
  action: Action
): RobotApiState {
  if (action.type === DISMISS_REQUEST) {
    return omit(state, action.payload.requestId)
  }
  // @ts-expect-error(sa, 2021-05-17): type guard action.meta
  const meta = action.meta ? action.meta : {}

  if (meta.requestId != null) {
    if (!meta.response) {
      return { ...state, [meta.requestId]: { status: PENDING } }
    }

    if (meta.response.ok) {
      return {
        ...state,
        [meta.requestId]: { status: SUCCESS, response: meta.response },
      }
    }

    if (meta.response.ok === false) {
      const error =
        // @ts-expect-error(sa, 2021-05-17): type guard action.payload
        action.payload && action.payload.error ? action.payload.error : {}

      return {
        ...state,
        [meta.requestId]: {
          status: FAILURE,
          response: meta.response,
          error,
        },
      }
    }
  }

  return state
}
