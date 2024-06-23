// Actions for triggering analytics events that don't work well as epics looking
// for unrelated events

import * as Constants from './constants'
import type * as Types from './types'

export const pipetteOffsetCalibrationStarted = (
  mount: string,
  calBlock: boolean,
  shouldPerformTipLength: boolean,
  tipRackURI: string | null
): Types.PipetteOffsetStartedAnalyticsAction => ({
  type: Constants.ANALYTICS_PIPETTE_OFFSET_STARTED,
  payload: {
    mount: mount,
    calBlock: calBlock,
    shouldPerformTipLength: shouldPerformTipLength,
    tipRackURI: tipRackURI,
  },
})

export const tipLengthCalibrationStarted = (
  mount: string,
  calBlock: boolean,
  tipRackURI: string
): Types.TipLengthStartedAnalyticsAction => ({
  type: Constants.ANALYTICS_TIP_LENGTH_STARTED,
  payload: {
    mount: mount,
    calBlock: calBlock,
    tipRackURI: tipRackURI,
  },
})
