import uniq from 'lodash/uniq'
import {
  getArgsAndErrorsByStepId,
  getPipetteEntities,
  getSavedStepForms,
} from '../step-forms/selectors'
import { getFileMetadata } from '../file-data/selectors'
import { trackEvent } from './mixpanel'
import { getHasOptedIn } from './selectors'
import { flattenNestedProperties } from './utils/flattenNestedProperties'
import type { Middleware } from 'redux'
import type { BaseState } from '../types'
import type { FormData, StepIdType, StepType } from '../form-types'
import type { StepArgsAndErrors } from '../steplist'
import type { SaveStepFormAction } from '../ui/steps/actions/thunks'
import type { AnalyticsEventAction } from './actions'
import type { AnalyticsEvent } from './mixpanel'

// Converts Redux actions to analytics events (read: Mixpanel events).
// Returns null if there is no analytics event associated with the action,
// which happens for most actions.
export const reduxActionToAnalyticsEvent = (
  state: BaseState,
  action: any
): AnalyticsEvent | null => {
  if (action.type === 'SAVE_STEP_FORM') {
    // create the "saveStep" action, taking advantage of the formToArgs machinery
    // to get nice cleaned-up data instead of the raw form data.
    const a: SaveStepFormAction = action
    const argsAndErrors: StepArgsAndErrors = getArgsAndErrorsByStepId(state)[
      a.payload.id
    ]
    const { stepArgs } = argsAndErrors

    if (stepArgs !== null) {
      const pipetteEntities = getPipetteEntities(state)
      const fileMetadata = getFileMetadata(state)
      const dateCreatedTimestamp = fileMetadata.created

      // additional fields for analytics, eg descriptive name for pipettes
      // (these fields are prefixed with double underscore only to make sure they
      // never accidentally overlap with actual fields)
      const additionalProperties = flattenNestedProperties(
        (stepArgs as unknown) as Record<string, unknown>
      )

      // Mixpanel wants YYYY-MM-DDTHH:MM:SS for Date type
      additionalProperties.__dateCreated =
        dateCreatedTimestamp != null && Number.isFinite(dateCreatedTimestamp)
          ? new Date(dateCreatedTimestamp).toISOString()
          : null

      additionalProperties.__protocolName = fileMetadata.protocolName
      if ('pipette' in stepArgs && stepArgs.pipette != null) {
        additionalProperties.__pipetteName =
          pipetteEntities[stepArgs?.pipette].name
      }

      return {
        name: 'saveStep',
        properties: { ...stepArgs, ...additionalProperties },
      }
    }
  }
  if (action.type === 'SAVE_STEP_FORMS_MULTI') {
    const fileMetadata = getFileMetadata(state)
    const dateCreatedTimestamp = fileMetadata.created

    const { editedFields, stepIds } = action.payload
    const additionalProperties = flattenNestedProperties(
      editedFields as Record<string, unknown>
    )
    const savedStepForms = getSavedStepForms(state)
    const batchEditedStepForms: FormData[] = stepIds.map(
      (id: StepIdType) => savedStepForms[id]
    )
    let stepType = null
    const uniqueStepTypes: StepType[] = uniq(
      batchEditedStepForms.map(form => form.stepType)
    )
    if (uniqueStepTypes.length === 1) {
      stepType = uniqueStepTypes[0]
    } else {
      console.warn(
        `Something went wrong, expected one step type in the batch edit form, but got ${String(
          uniqueStepTypes
        )} `
      )
    }

    additionalProperties.stepType = stepType

    // (these fields are prefixed with double underscore only to make sure they
    // never accidentally overlap with actual fields)
    // Mixpanel wants YYYY-MM-DDTHH:MM:SS for Date type
    additionalProperties.__dateCreated =
      dateCreatedTimestamp != null && Number.isFinite(dateCreatedTimestamp)
        ? new Date(dateCreatedTimestamp).toISOString()
        : null

    additionalProperties.__protocolName = fileMetadata.protocolName

    return {
      name: 'saveStepsMulti',
      properties: { ...editedFields, ...additionalProperties },
    }
  }
  if (action.type === 'DELETE_MULTIPLE_STEPS') {
    return {
      name: 'deleteMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'DUPLICATE_MULTIPLE_STEPS') {
    return {
      name: 'duplicateMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'EXPAND_MULTIPLE_STEPS') {
    return {
      name: 'expandMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'COLLAPSE_MULTIPLE_STEPS') {
    return {
      name: 'collapseMultipleSteps',
      properties: {},
    }
  }
  if (action.type === 'ANALYTICS_EVENT') {
    const a: AnalyticsEventAction = action
    return a.payload
  }
  return null
}

export const trackEventMiddleware: Middleware<BaseState, any> = ({
  getState,
  dispatch,
}) => next => action => {
  const result = next(action)

  // NOTE: this is the Redux state AFTER the action has been fully dispatched
  const state = getState()

  const optedIn = getHasOptedIn(state as BaseState) ?? false
  const event = reduxActionToAnalyticsEvent(state as BaseState, action)
  if (event != null) {
    // actually report to analytics (trackEvent is responsible for using optedIn)
    trackEvent(event, optedIn)
  }
  return result
}
