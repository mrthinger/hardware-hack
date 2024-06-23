import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { FileUploadMessage, LoadFileAction } from './types'
import type { FileUploadMessageAction } from './actions'
// Keep track of file upload errors / messages
type FileUploadMessageState = FileUploadMessage | null | undefined

// @ts-expect-error(sb, 2021-6-17): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const fileUploadMessage: Reducer<FileUploadMessageState, any> = handleActions(
  {
    FILE_UPLOAD_MESSAGE: (
      state,
      action: FileUploadMessageAction
    ): FileUploadMessageState => action.payload,
    LOAD_FILE: (state, action: LoadFileAction): FileUploadMessageState =>
      action.payload.didMigrate
        ? {
            isError: false,
            messageKey: 'DID_MIGRATE',
            migrationsRan: action.payload.migrationsRan,
          }
        : state,
    DISMISS_FILE_UPLOAD_MESSAGE: (): FileUploadMessageState => null,
  },
  null
)

// NOTE: whenever we add or change any of the action types that indicate
// "changes to the protocol", those action types need to be updated here.
const unsavedChanges = (
  state: boolean = false,
  action: {
    type: string
    payload: any
  }
): boolean => {
  switch (action.type) {
    case 'LOAD_FILE': {
      return action.payload.didMigrate // no unsaved changes unless migration happened
    }

    case 'SAVE_PROTOCOL_FILE':
      return false

    case 'CREATE_NEW_PROTOCOL':
    case 'DISMISS_FORM_WARNING':
    case 'DISMISS_TIMELINE_WARNING':
    case 'CREATE_CONTAINER':
    case 'DELETE_CONTAINER':
    case 'CHANGE_SAVED_STEP_FORM':
    case 'DUPLICATE_LABWARE':
    case 'MOVE_DECK_ITEM':
    case 'RENAME_LABWARE':
    case 'DELETE_LIQUID_GROUP':
    case 'EDIT_LIQUID_GROUP':
    case 'REMOVE_WELLS_CONTENTS':
    case 'SET_WELL_CONTENTS':
    case 'ADD_STEP':
    case 'DELETE_STEP':
    case 'DELETE_MULTIPLE_STEPS':
    case 'SAVE_STEP_FORM':
    case 'SAVE_FILE_METADATA':
    case 'REPLACE_CUSTOM_LABWARE_DEF':
    case 'CREATE_MODULE':
    case 'DELETE_MODULE':
    case 'EDIT_MODULE':
    case 'TOGGLE_IS_GRIPPER_REQUIRED':
    case 'DELETE_DECK_FIXTURE':
    case 'CREATE_DECK_FIXTURE':
      return true

    default:
      return state
  }
}

export const _allReducers = {
  fileUploadMessage,
  unsavedChanges,
}
export interface RootState {
  fileUploadMessage: FileUploadMessageState
  unsavedChanges: boolean
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
