import get from 'lodash/get'
import has from 'lodash/has'
import union from 'lodash/union'
import without from 'lodash/without'

import {
  UPDATE_VALUE,
  TOGGLE_VALUE,
  RESET_VALUE,
  ADD_UNIQUE_VALUE,
  SUBTRACT_VALUE,
} from '../constants'

import { DEFAULTS } from './migrate'

import type { ConfigValueChangeAction } from '@opentrons/app/src/redux/config/types'
import type { Config, Overrides } from './types'

export function shouldUpdate(path: string, overrides: Overrides): boolean {
  return !has(overrides, path)
}

export function getNextValue(
  action: ConfigValueChangeAction,
  config: Config
): unknown {
  switch (action.type) {
    case UPDATE_VALUE: {
      return action.payload.value
    }

    case RESET_VALUE: {
      return get(DEFAULTS, action.payload.path)
    }

    case TOGGLE_VALUE: {
      const value = get(config, action.payload.path)
      return typeof value === 'boolean' || typeof value === 'undefined'
        ? !value // eslint-disable-line @typescript-eslint/strict-boolean-expressions
        : value
    }

    case ADD_UNIQUE_VALUE: {
      const value = get(config, action.payload.path)
      return Array.isArray(value) ? union(value, [action.payload.value]) : value
    }

    case SUBTRACT_VALUE: {
      const value = get(config, action.payload.path)
      return Array.isArray(value) ? without(value, action.payload.value) : value
    }
  }
}
