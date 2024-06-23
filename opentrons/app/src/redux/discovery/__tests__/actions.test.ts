import { describe, it, expect } from 'vitest'

import * as actions from '../actions'
import type { Action } from '../../types'

describe('discovery actions', () => {
  const SPECS: Array<{
    name: string
    creator: (...args: any[]) => Action
    args: any[]
    expected: unknown
  }> = [
    {
      name: 'startDiscovery',
      creator: actions.startDiscovery,
      args: [],
      expected: {
        type: 'discovery:START',
        payload: { timeout: null },
        meta: { shell: true },
      },
    },
    {
      name: 'startDiscovery with timeout specified',
      creator: actions.startDiscovery,
      args: [30000],
      expected: {
        type: 'discovery:START',
        payload: { timeout: 30000 },
        meta: { shell: true },
      },
    },
    {
      name: 'finishDiscovery',
      creator: actions.finishDiscovery,
      args: [],
      expected: { type: 'discovery:FINISH', meta: { shell: true } },
    },
    {
      name: 'removeRobot',
      creator: actions.removeRobot,
      args: ['robot-name'],
      expected: {
        type: 'discovery:REMOVE',
        payload: { robotName: 'robot-name' },
        meta: { shell: true },
      },
    },
    {
      name: 'clearDiscoveryCache',
      creator: actions.clearDiscoveryCache,
      args: [],
      expected: { type: 'discovery:CLEAR_CACHE', meta: { shell: true } },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec

    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
