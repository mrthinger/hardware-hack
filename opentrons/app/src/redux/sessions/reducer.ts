import omit from 'lodash/omit'

import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { SessionState, PerRobotSessionState } from './types'

const INITIAL_STATE: SessionState = {}

const INITIAL_PER_ROBOT_STATE: PerRobotSessionState = {
  robotSessions: null,
}

export const sessionReducer: Reducer<SessionState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.CREATE_SESSION_SUCCESS:
    case Constants.FETCH_SESSION_SUCCESS:
    case Constants.CREATE_SESSION_COMMAND_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionState.data.id]: sessionState.data,
          },
        },
      }
    }

    case Constants.FETCH_ALL_SESSIONS_SUCCESS: {
      const { robotName, sessions } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      const sessionsById = sessions.reduce(
        (acc, s) => ({ ...acc, [s.id]: { ...s, id: s.id } }),
        {}
      )

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: sessionsById,
        },
      }
    }

    case Constants.DELETE_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: omit(robotState.robotSessions, sessionState.data.id),
        },
      }
    }

    case Constants.FETCH_SESSION_FAILURE:
    case Constants.DELETE_SESSION_FAILURE: {
      const { robotName, sessionId } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      // if session with this id not found, we should forget this id
      if (action.meta.response.status === 404) {
        return {
          ...state,
          [robotName]: {
            ...robotState,
            robotSessions: omit(robotState.robotSessions, sessionId),
          },
        }
      } else {
        return state
      }
    }
  }

  return state
}
