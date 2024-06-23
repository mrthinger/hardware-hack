import { describe, it, expect } from 'vitest'

import * as Fixtures from '../__fixtures__'
import * as actions from '../actions'

import type { Action } from '../../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args?: unknown[]
  expected: Action
}

describe('custom labware actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'fetchCustomLabware',
      creator: actions.fetchCustomLabware,
      expected: { type: 'labware:FETCH_CUSTOM_LABWARE', meta: { shell: true } },
    },
    {
      name: 'customLabwareList from poll',
      creator: actions.customLabwareList,
      args: [
        [
          { type: 'INVALID_LABWARE_FILE', filename: 'a.json', modified: 0 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', modified: 1 },
        ],
      ],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [
          {
            type: 'INVALID_LABWARE_FILE',
            filename: 'a.json',
            modified: 0,
          } as any,
          {
            type: 'INVALID_LABWARE_FILE',
            filename: 'b.json',
            modified: 1,
          } as any,
        ],
        meta: { source: 'poll' },
      },
    },
    {
      name: 'customLabwareList from source',
      creator: actions.customLabwareList,
      args: [
        [{ type: 'INVALID_LABWARE_FILE', filename: 'a.json', modified: 0 }],
        'changeDirectory',
      ],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [
          {
            type: 'INVALID_LABWARE_FILE',
            filename: 'a.json',
            modified: 0,
          } as any,
        ],
        meta: { source: 'changeDirectory' },
      },
    },
    {
      name: 'customLabwareListFailure from poll',
      creator: actions.customLabwareListFailure,
      args: ['AH!'],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST_FAILURE',
        payload: { message: 'AH!' },
        meta: { source: 'poll' },
      },
    },
    {
      name: 'customLabwareListFailure from source',
      creator: actions.customLabwareListFailure,
      args: ['AH!', 'changeDirectory'],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST_FAILURE',
        payload: { message: 'AH!' },
        meta: { source: 'changeDirectory' },
      },
    },
    {
      name: 'changeLabwareDirectory',
      creator: actions.changeCustomLabwareDirectory,
      args: [],
      expected: {
        type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabware without overwrite',
      creator: actions.addCustomLabware,
      args: [],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE',
        payload: { overwrite: null },
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabware with overwrite',
      creator: actions.addCustomLabware,
      args: [Fixtures.mockDuplicateLabware],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE',
        payload: { overwrite: Fixtures.mockDuplicateLabware },
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabwareFile',
      creator: actions.addCustomLabwareFile,
      args: ['mock/file/path'],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE_FILE',
        payload: { filePath: 'mock/file/path' },
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabwareFailure with failed labware',
      creator: actions.addCustomLabwareFailure,
      args: [{ type: 'INVALID_LABWARE_FILE', filename: 'a.json', modified: 0 }],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: {
          message: null,
          labware: {
            type: 'INVALID_LABWARE_FILE',
            filename: 'a.json',
            modified: 0,
          },
        },
      },
    },
    {
      name: 'addCustomLabwareFailure with error message',
      creator: actions.addCustomLabwareFailure,
      args: [null, 'AH'],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: { labware: null, message: 'AH' },
      },
    },
    {
      name: 'clearAddCustomLabwareFailure',
      creator: actions.clearAddCustomLabwareFailure,
      args: [],
      expected: { type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE' },
    },
    {
      name: 'addNewLabwareName',
      creator: actions.addNewLabwareName,
      args: ['mockLabwareName'],
      expected: {
        type: 'labware:ADD_NEW_LABWARE_NAME',
        payload: { filename: 'mockLabwareName' },
      },
    },
    {
      name: 'clearNewLabwareName',
      creator: actions.clearNewLabwareName,
      args: [],
      expected: { type: 'labware:CLEAR_NEW_LABWARE_NAME' },
    },
    {
      name: 'openCustomLabwareDirectory',
      creator: actions.openCustomLabwareDirectory,
      args: [],
      expected: {
        type: 'labware:OPEN_CUSTOM_LABWARE_DIRECTORY',
        meta: { shell: true },
      },
    },
    {
      name: 'resetCustomLabwareDirectory',
      creator: actions.resetCustomLabwareDirectory,
      args: [],
      expected: {
        type: 'config:RESET_VALUE',
        payload: { path: 'labware.directory' },
        meta: { shell: true },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, expected, args = [] } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
