import { describe, it, expect } from 'vitest'

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { PipettesAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: PipettesAction
}

describe('robot pipettes actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'pipettes:FETCH_PIPETTES without refresh',
      creator: Actions.fetchPipettes,
      args: ['robot-name'],
      expected: {
        type: 'pipettes:FETCH_PIPETTES',
        payload: { robotName: 'robot-name', refresh: false },
        meta: {} as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES with refresh',
      creator: Actions.fetchPipettes,
      args: ['robot-name', true],
      expected: {
        type: 'pipettes:FETCH_PIPETTES',
        payload: { robotName: 'robot-name', refresh: true },
        meta: {} as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES_SUCCESS',
      creator: Actions.fetchPipettesSuccess,
      args: [
        'robot-name',
        Fixtures.mockFetchPipettesSuccess.body,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'pipettes:FETCH_PIPETTES_SUCCESS',
        payload: {
          robotName: 'robot-name',
          pipettes: Fixtures.mockFetchPipettesSuccess.body,
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTES_FAILURE',
      creator: Actions.fetchPipettesFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'pipettes:FETCH_PIPETTES_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTE_SETTINGS',
      creator: Actions.fetchPipetteSettings,
      args: ['robot-name'],
      expected: {
        type: 'pipettes:FETCH_PIPETTE_SETTINGS',
        payload: { robotName: 'robot-name' },
        meta: {} as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS',
      creator: Actions.fetchPipetteSettingsSuccess,
      args: [
        'robot-name',
        { pipetteId: Fixtures.mockPipetteSettings },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS',
        payload: {
          robotName: 'robot-name',
          settings: { pipetteId: Fixtures.mockPipetteSettings },
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE',
      creator: Actions.fetchPipetteSettingsFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'pipettes:FETCH_PIPETTE_SETTINGS_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'pipettes:UPDATE_PIPETTE_SETTINGS',
      creator: Actions.updatePipetteSettings,
      args: ['robot-name', 'pipette-id', { fieldA: 42, fieldB: null }],
      expected: {
        type: 'pipettes:UPDATE_PIPETTE_SETTINGS',
        payload: {
          robotName: 'robot-name',
          pipetteId: 'pipette-id',
          fields: { fieldA: 42, fieldB: null },
        },
        meta: {} as any,
      },
    },
    {
      name: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS',
      creator: Actions.updatePipetteSettingsSuccess,
      args: [
        'robot-name',
        'pipette-id',
        Fixtures.mockUpdatePipetteSettingsSuccess.body.fields,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS',
        payload: {
          robotName: 'robot-name',
          pipetteId: 'pipette-id',
          fields: Fixtures.mockUpdatePipetteSettingsSuccess.body.fields,
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE',
      creator: Actions.updatePipetteSettingsFailure,
      args: [
        'robot-name',
        'pipette-id',
        { message: 'AH' },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'pipettes:UPDATE_PIPETTE_SETTINGS_FAILURE',
        payload: {
          robotName: 'robot-name',
          pipetteId: 'pipette-id',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' } as any,
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
