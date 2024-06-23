// TODO(IL, 2020-09-09): reconcile with app/src/analytics/mixpanel.js, which this is derived from
import mixpanel from 'mixpanel-browser'
import { getIsProduction } from '../networking/opentronsWebApi'
import { getHasOptedIn } from './selectors'
import type { BaseState } from '../types'

// TODO(IL, 2020-09-09): AnalyticsEvent type copied from app/src/analytics/types.js, consider merging
export type AnalyticsEvent =
  | {
      name: string
      properties: Record<string, unknown>
      superProperties?: Record<string, unknown>
    }
  | { superProperties: Record<string, unknown> }

// pulled in from environment at build time
const MIXPANEL_ID = getIsProduction()
  ? process.env.OT_PD_MIXPANEL_ID
  : process.env.OT_PD_MIXPANEL_DEV_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
}

export function initializeMixpanel(state: BaseState): void {
  const optedIn = getHasOptedIn(state) ?? false
  if (MIXPANEL_ID != null) {
    console.debug('Initializing Mixpanel', { optedIn })

    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
    setMixpanelTracking(optedIn)
    trackEvent({ name: 'appOpen', properties: {} }, optedIn) // TODO IMMEDIATELY: do we want this?
  } else {
    console.warn('MIXPANEL_ID not found; this is a bug if build is production')
  }
}

// NOTE: Do not use directly. Used in analytics Redux middleware: trackEventMiddleware.
export function trackEvent(event: AnalyticsEvent, optedIn: boolean): void {
  console.debug('Trackable event', { event, optedIn })
  if (MIXPANEL_ID != null && optedIn) {
    if ('superProperties' in event && event.superProperties != null) {
      mixpanel.register(event.superProperties)
    }
    if ('name' in event && event.name != null) {
      mixpanel.track(event.name, event.properties)
    }
  }
}

export function setMixpanelTracking(optedIn: boolean): void {
  if (MIXPANEL_ID != null) {
    if (optedIn) {
      console.debug('User has opted into analytics; tracking with Mixpanel')
      mixpanel.opt_in_tracking()
      // Register "super properties" which are included with all events
      mixpanel.register({
        appVersion: process.env.OT_PD_VERSION,
        // NOTE(IL, 2020): Since PD may be in the same Mixpanel project as other OT web apps, this 'appName' property is intended to distinguish it
        appName: 'protocolDesigner',
      })
    } else {
      console.debug(
        'User has opted out of analytics; stopping Mixpanel tracking'
      )
      mixpanel.opt_out_tracking()
      mixpanel.reset()
    }
  }
}
