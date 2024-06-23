import type { HealthPollerResult } from '../types'
import type { MdnsBrowserService } from '../mdns-browser'

import type * as Types from './types'

export const SERVICE_FOUND: 'mdns:SERVICE_FOUND' = 'mdns:SERVICE_FOUND'

export const HEALTH_POLLED: 'http:HEALTH_POLLED' = 'http:HEALTH_POLLED'

export const INITIALIZE_STATE: 'client:INITIALIZE_STATE' =
  'client:INITIALIZE_STATE'

export const ADD_IP_ADDRESS: 'client:ADD_IP_ADDRESS' = 'client:ADD_IP_ADDRESS'

export const REMOVE_IP_ADDRESS: 'client:REMOVE_IP_ADDRESS' =
  'client:REMOVE_IP_ADDRESS'

export const REMOVE_ROBOT: 'client:REMOVE_ROBOT' = 'client:REMOVE_ROBOT'

export const initializeState = (
  payload: Types.InitializeStateAction['payload']
): Types.InitializeStateAction => ({
  type: INITIALIZE_STATE,
  payload,
})

export const serviceFound = (
  payload: MdnsBrowserService
): Types.ServiceFoundAction => ({
  type: SERVICE_FOUND,
  payload,
})

export const healthPolled = (
  payload: HealthPollerResult
): Types.HealthPolledAction => ({
  type: HEALTH_POLLED,
  payload,
})

export const removeRobot = (name: string): Types.RemoveRobotAction => ({
  type: REMOVE_ROBOT,
  payload: { name },
})
