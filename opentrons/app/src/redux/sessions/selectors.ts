import type { State } from '../types'
import type * as Types from './types'

export const getRobotSessions: (
  state: State,
  robotName: string
) => Types.SessionsById | null = (state, robotName) =>
  state.sessions[robotName]?.robotSessions ?? null

export const getRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.Session | null = (state, robotName, sessionId) => {
  return (getRobotSessions(state, robotName) || {})[sessionId] ?? null
}

export function getRobotSessionOfType(
  state: State,
  robotName: string,
  sessionType: Types.SessionType
): Types.Session | null {
  const sessionsById = getRobotSessions(state, robotName) || {}
  const foundSessionId =
    Object.keys(sessionsById).find(
      id => sessionsById[id].sessionType === sessionType
    ) ?? null
  return foundSessionId ? sessionsById[foundSessionId] : null
}
