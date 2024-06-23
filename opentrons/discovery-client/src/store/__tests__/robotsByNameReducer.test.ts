import { describe, expect, it } from 'vitest'
// discovery client reducer
import {
  mockLegacyHealthResponse,
  mockLegacyServerHealthResponse,
  mockHealthErrorJsonResponse,
} from '../../fixtures/health'

import * as Actions from '../actions'
import { reducer, robotsByNameReducer } from '../reducer'
import type { HealthResponse, ServerHealthResponse } from '../../types'
import type { Action, RobotsByNameMap } from '../types'

describe('robotsByName reducer', () => {
  it('should return an empty initial state under robotsByName in the root reducer', () => {
    const state = reducer(undefined, {} as Action)
    expect(state.robotsByName).toEqual({})
  })

  it('should not overwrite state if "client:INITIALIZE_STATE" action has no robots', () => {
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: null,
        serverHealth: null,
      },
    }
    const action = Actions.initializeState({})
    const state = robotsByNameReducer(initialState, action)

    expect(state).toBe(initialState)
  })

  it('should overwrite state with robots from "client:INITIALIZE_STATE"', () => {
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: null,
        serverHealth: null,
      },
    }

    const action = Actions.initializeState({
      initialRobots: [
        {
          name: 'opentrons-1',
          health: mockLegacyHealthResponse,
          serverHealth: mockLegacyServerHealthResponse,
          addresses: [],
        },
        {
          name: 'opentrons-2',
          health: null,
          serverHealth: mockLegacyServerHealthResponse,
          addresses: [],
        },
        {
          name: 'opentrons-3',
          health: mockLegacyHealthResponse,
          serverHealth: null,
          addresses: [],
        },
      ],
    })
    const state = robotsByNameReducer(initialState, action)

    expect(state).toEqual({
      'opentrons-1': {
        name: 'opentrons-1',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
      'opentrons-2': {
        name: 'opentrons-2',
        health: null,
        serverHealth: mockLegacyServerHealthResponse,
      },
      'opentrons-3': {
        name: 'opentrons-3',
        health: mockLegacyHealthResponse,
        serverHealth: null,
      },
    })
  })

  it('should handle an "mdns:SERVICE_FOUND action for a new robot', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })
    const initialState = {}

    expect(robotsByNameReducer(initialState, action)).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: null,
        serverHealth: null,
      },
    })
  })

  it('should handle an "mdns:SERVICE_FOUND action for an existing robot', () => {
    const action = Actions.serviceFound({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })
    const initialState: RobotsByNameMap = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: ({ mockHealth: true } as unknown) as HealthResponse,
        serverHealth: ({
          mockServerHealth: true,
        } as unknown) as ServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    // ensure state is neither mutated nor recreated
    expect(nextState).toEqual(initialState)
    expect(nextState).toBe(initialState)
  })

  it('should handle an "http:HEALTH_POLLED action for a new robot', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {}
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    })
  })

  it('should handle a good "http:HEALTH_POLLED action for an existing robot with unknown health', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: null,
        serverHealth: null,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    })
  })

  it('should do nothing with a bad health poll', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: null,
      serverHealth: null,
      healthError: mockHealthErrorJsonResponse,
      serverHealthError: mockHealthErrorJsonResponse,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    // ensure state has neither mutated nor changed reference
    expect(nextState).toEqual(initialState)
    expect(nextState).toBe(initialState)
  })

  it('should be able to do a partial update to health', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: null,
      healthError: null,
      serverHealthError: mockHealthErrorJsonResponse,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: null,
        serverHealth: mockLegacyServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    })
  })

  it('should be able to do a partial update to serverHealth', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: null,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: mockHealthErrorJsonResponse,
      serverHealthError: null,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: null,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    })
  })

  it('should update health with a good health poll', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: { ...mockLegacyHealthResponse, api_version: '0.0.0' },
        serverHealth: {
          ...mockLegacyServerHealthResponse,
          apiServerVersion: '0.0.0',
        },
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    })
  })

  it('should not update state if new poll results are deep equal', () => {
    const action = Actions.healthPolled({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    // ensure state has neither mutated nor changed reference
    expect(nextState).toEqual(initialState)
    expect(nextState).toBe(initialState)
  })

  it('should handle a "client:REMOVE_ROBOT" action for an existing robot', () => {
    const action = Actions.removeRobot('opentrons-dev')
    const initialState = {
      'opentrons-dev': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toEqual({})
  })

  it('should noop "client:REMOVE_ROBOT" is robot not in state', () => {
    const action = Actions.removeRobot('opentrons-dev')
    const initialState = {
      'opentrons-other': {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
      },
    }
    const nextState = robotsByNameReducer(initialState, action)

    expect(nextState).toBe(initialState)
  })
})
