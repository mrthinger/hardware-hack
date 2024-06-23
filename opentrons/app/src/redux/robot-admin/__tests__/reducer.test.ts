import { describe, it, expect } from 'vitest'

import { robotAdminReducer } from '../reducer'

import type { PerRobotAdminState } from '../types'
import type { RobotApiRequestMeta } from '../../robot-api/types'
import type { Action } from '../../types'

type PartialState = Partial<{
  [robotName: string]: undefined | Partial<PerRobotAdminState>
}>

describe('robotAdminReducer', () => {
  it('should handle robotAdmin:RESTART_FAILURE', () => {
    const state: PartialState = {}
    const action: Action = {
      type: 'robotAdmin:RESTART_FAILURE',
      payload: { robotName: 'robotName', error: { message: 'AH' } },
      meta: {} as RobotApiRequestMeta,
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        restart: { status: 'restart-failed', bootId: null, startTime: null },
      },
    })
  })

  it('should handle robotAdmin:RESTART_STATUS_CHANGED with boot ID', () => {
    const state: PartialState = {}
    const action: Action = {
      type: 'robotAdmin:RESTART_STATUS_CHANGED',
      payload: {
        robotName: 'robotName',
        restartStatus: 'restart-pending',
        bootId: 'abc123',
        startTime: new Date('2000-01-01'),
      },
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        restart: {
          status: 'restart-pending',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    })
  })

  it('should handle robotAdmin:RESTART_STATUS_CHANGED without boot ID', () => {
    const state: PartialState = {
      robotName: {
        restart: {
          status: 'restart-pending',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    }
    const action: Action = {
      type: 'robotAdmin:RESTART_STATUS_CHANGED',
      payload: {
        robotName: 'robotName',
        restartStatus: 'restart-in-progress',
        bootId: null,
        startTime: null,
      },
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        restart: {
          status: 'restart-in-progress',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    })
  })

  it('should handle robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS', () => {
    const state: PartialState = {
      robotName: {
        resetConfigOptions: [],
      },
    }
    const action: Action = {
      type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
      payload: {
        robotName: 'robotName',
        options: [
          { id: 'foo', name: 'Foo', description: 'foobar' },
          { id: 'baz', name: 'Baz', description: 'bazqux' },
        ],
      },
      meta: {} as RobotApiRequestMeta,
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        resetConfigOptions: [
          { id: 'foo', name: 'Foo', description: 'foobar' },
          { id: 'baz', name: 'Baz', description: 'bazqux' },
        ],
      },
    })
  })
})
