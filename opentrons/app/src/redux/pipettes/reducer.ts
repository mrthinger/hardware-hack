import * as Constants from './constants'

import type { Action } from '../types'
import type { PipettesState, PerRobotPipettesState } from './types'
import type { Reducer } from 'redux'

const INITIAL_STATE: PipettesState = {}

const INITIAL_PIPETTES_STATE: PerRobotPipettesState = {
  attachedByMount: null,
  settingsById: null,
}

export const pipettesReducer: Reducer<PipettesState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.FETCH_PIPETTES_SUCCESS: {
      const { robotName, pipettes } = action.payload
      const robotState = state[robotName] || INITIAL_PIPETTES_STATE

      return {
        ...state,
        [robotName]: { ...robotState, attachedByMount: pipettes },
      }
    }

    case Constants.FETCH_PIPETTE_SETTINGS_SUCCESS: {
      const { robotName, settings } = action.payload
      const robotState = state[robotName] || INITIAL_PIPETTES_STATE

      return {
        ...state,
        [robotName]: { ...robotState, settingsById: settings },
      }
    }

    case Constants.UPDATE_PIPETTE_SETTINGS_SUCCESS: {
      const { robotName, pipetteId, fields } = action.payload
      const robotState = state[robotName] || INITIAL_PIPETTES_STATE
      const settingsById = robotState.settingsById
      const pipetteSettings = settingsById?.[pipetteId]
      if (!settingsById || !pipetteSettings) return state

      return {
        ...state,
        [robotName]: {
          ...robotState,
          settingsById: {
            ...settingsById,
            [pipetteId]: { ...pipetteSettings, fields },
          },
        },
      }
    }
  }

  return state
}
