import * as Constants from './constants'
import type * as Types from './types'
import type {
  RobotApiRequestMeta,
  RobotApiV2ErrorResponseBody,
} from '../robot-api/types'

export const createSession = (
  robotName: string,
  sessionType: Types.SessionType,
  params: Types.SessionParams = {}
): Types.CreateSessionAction => ({
  type: Constants.CREATE_SESSION,
  payload: { robotName, sessionType, params },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})

export const createSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.CreateSessionSuccessAction => ({
  type: Constants.CREATE_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const createSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.CreateSessionFailureAction => ({
  type: Constants.CREATE_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const deleteSession = (
  robotName: string,
  sessionId: string
): Types.DeleteSessionAction => ({
  type: Constants.DELETE_SESSION,
  payload: { robotName, sessionId },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})

export const deleteSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.DeleteSessionSuccessAction => ({
  type: Constants.DELETE_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const deleteSessionFailure = (
  robotName: string,
  sessionId: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.DeleteSessionFailureAction => ({
  type: Constants.DELETE_SESSION_FAILURE,
  payload: { robotName, sessionId, error },
  meta: meta,
})

export const fetchSession = (
  robotName: string,
  sessionId: string
): Types.FetchSessionAction => ({
  type: Constants.FETCH_SESSION,
  payload: { robotName, sessionId },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})

export const fetchSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.FetchSessionSuccessAction => ({
  type: Constants.FETCH_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchSessionFailure = (
  robotName: string,
  sessionId: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.FetchSessionFailureAction => ({
  type: Constants.FETCH_SESSION_FAILURE,
  payload: { robotName, sessionId, error },
  meta: meta,
})

export const fetchAllSessions = (
  robotName: string
): Types.FetchAllSessionsAction => ({
  type: Constants.FETCH_ALL_SESSIONS,
  payload: { robotName },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})

export const fetchAllSessionsSuccess = (
  robotName: string,
  body: Types.MultiSessionResponse,
  meta: RobotApiRequestMeta
): Types.FetchAllSessionsSuccessAction => ({
  type: Constants.FETCH_ALL_SESSIONS_SUCCESS,
  payload: { robotName, sessions: body.data },
  meta: meta,
})

export const fetchAllSessionsFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.FetchAllSessionsFailureAction => ({
  type: Constants.FETCH_ALL_SESSIONS_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const createSessionCommand = (
  robotName: string,
  sessionId: string,
  command: Types.SessionCommandAttributes
): Types.CreateSessionCommandAction => ({
  type: Constants.CREATE_SESSION_COMMAND,
  payload: { robotName, sessionId, command },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})

export const createSessionCommandSuccess = (
  robotName: string,
  sessionId: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.CreateSessionCommandSuccessAction => ({
  type: Constants.CREATE_SESSION_COMMAND_SUCCESS,
  payload: { robotName, sessionId, ...body },
  meta: meta,
})

export const createSessionCommandFailure = (
  robotName: string,
  sessionId: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.CreateSessionCommandFailureAction => ({
  type: Constants.CREATE_SESSION_COMMAND_FAILURE,
  payload: { robotName, sessionId, error },
  meta: meta,
})

export const ensureSession = (
  robotName: string,
  sessionType: Types.SessionType,
  params: Types.SessionParams = {}
): Types.EnsureSessionAction => ({
  type: Constants.ENSURE_SESSION,
  payload: { robotName, sessionType, params },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  meta: {} as RobotApiRequestMeta,
})
