import { describe, it, expect } from 'vitest'

import { mockRobot, mockRequestMeta } from '../../robot-api/__fixtures__'
import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { NetworkingAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: NetworkingAction
}

describe('networking actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'can create networking:FETCH_STATUS',
      creator: Actions.fetchStatus,
      args: [mockRobot.name],
      expected: {
        type: 'networking:FETCH_STATUS',
        payload: { robotName: mockRobot.name },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:FETCH_STATUS_SUCCESS',
      creator: Actions.fetchStatusSuccess,
      args: [
        mockRobot.name,
        Fixtures.mockNetworkingStatusSuccess.body.status,
        Fixtures.mockNetworkingStatusSuccess.body.interfaces,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_STATUS_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          internetStatus: Fixtures.mockNetworkingStatusSuccess.body.status,
          interfaces: Fixtures.mockNetworkingStatusSuccess.body.interfaces,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:FETCH_STATUS_FAILURE',
      creator: Actions.fetchStatusFailure,
      args: [
        mockRobot.name,
        Fixtures.mockNetworkingStatusFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_STATUS_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockNetworkingStatusFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_CONFIGURE',
      creator: Actions.postWifiConfigure,
      args: [mockRobot.name, { ssid: 'network-name', psk: 'network-password' }],
      expected: {
        type: 'networking:POST_WIFI_CONFIGURE',
        payload: {
          robotName: mockRobot.name,
          options: { ssid: 'network-name', psk: 'network-password' },
        },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:POST_WIFI_CONFIGURE_SUCCESS',
      creator: Actions.postWifiConfigureSuccess,
      args: [mockRobot.name, 'network-name', mockRequestMeta],
      expected: {
        type: 'networking:POST_WIFI_CONFIGURE_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          ssid: 'network-name',
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_CONFIGURE_FAILURE',
      creator: Actions.postWifiConfigureFailure,
      args: [
        mockRobot.name,
        Fixtures.mockWifiConfigureFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:POST_WIFI_CONFIGURE_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockWifiListFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:FETCH_WIFI_KEYS',
      creator: Actions.fetchWifiKeys,
      args: [mockRobot.name],
      expected: {
        type: 'networking:FETCH_WIFI_KEYS',
        payload: { robotName: mockRobot.name },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:FETCH_WIFI_KEYS_SUCCESS',
      creator: Actions.fetchWifiKeysSuccess,
      args: [mockRobot.name, [Fixtures.mockWifiKey], mockRequestMeta],
      expected: {
        type: 'networking:FETCH_WIFI_KEYS_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          wifiKeys: [Fixtures.mockWifiKey],
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:FETCH_WIFI_KEYS_FAILURE',
      creator: Actions.fetchWifiKeysFailure,
      args: [
        mockRobot.name,
        Fixtures.mockFetchWifiKeysFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_WIFI_KEYS_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockFetchWifiKeysFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_KEYS',
      creator: Actions.postWifiKeys,
      args: [mockRobot.name, { name: 'key.crt' } as File],
      expected: {
        type: 'networking:POST_WIFI_KEYS',
        payload: {
          robotName: mockRobot.name,
          keyFile: { name: 'key.crt' } as File,
        },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:POST_WIFI_KEYS_SUCCESS',
      creator: Actions.postWifiKeysSuccess,
      args: [mockRobot.name, Fixtures.mockWifiKey, mockRequestMeta],
      expected: {
        type: 'networking:POST_WIFI_KEYS_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          wifiKey: Fixtures.mockWifiKey,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_KEYS_FAILURE',
      creator: Actions.postWifiKeysFailure,
      args: [
        mockRobot.name,
        Fixtures.mockFetchWifiKeysFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:POST_WIFI_KEYS_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockPostWifiKeysFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:FETCH_EAP_OPTIONS',
      creator: Actions.fetchEapOptions,
      args: [mockRobot.name],
      expected: {
        type: 'networking:FETCH_EAP_OPTIONS',
        payload: { robotName: mockRobot.name },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:FETCH_EAP_OPTIONS_SUCCESS',
      creator: Actions.fetchEapOptionsSuccess,
      args: [mockRobot.name, [Fixtures.mockEapOption], mockRequestMeta],
      expected: {
        type: 'networking:FETCH_EAP_OPTIONS_SUCCESS',
        payload: {
          robotName: mockRobot.name,
          eapOptions: [Fixtures.mockEapOption],
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:FETCH_EAP_OPTIONS_FAILURE',
      creator: Actions.fetchEapOptionsFailure,
      args: [
        mockRobot.name,
        Fixtures.mockFetchEapOptionsFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:FETCH_EAP_OPTIONS_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockFetchEapOptionsFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_DISCONNECT',
      creator: Actions.postWifiDisconnect,
      args: [mockRobot.name, Fixtures.mockNetworkingDisconnect.ssid],
      expected: {
        type: 'networking:POST_WIFI_DISCONNECT',
        payload: {
          robotName: mockRobot.name,
          ...Fixtures.mockNetworkingDisconnect,
        },
        meta: {} as any,
      },
    },
    {
      name: 'can create networking:POST_WIFI_DISCONNECT_SUCCESS',
      creator: Actions.postWifiDisconnectSuccess,
      args: [mockRobot.name, mockRequestMeta],
      expected: {
        type: 'networking:POST_WIFI_DISCONNECT_SUCCESS',
        payload: { robotName: mockRobot.name },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:POST_WIFI_DISCONNECT_FAILURE',
      creator: Actions.postWifiDisconnectFailure,
      args: [
        mockRobot.name,
        Fixtures.mockNetworkingDisconnectFailure.body,
        mockRequestMeta,
      ],
      expected: {
        type: 'networking:POST_WIFI_DISCONNECT_FAILURE',
        payload: {
          robotName: mockRobot.name,
          error: Fixtures.mockNetworkingDisconnectFailure.body,
        },
        meta: mockRequestMeta,
      },
    },
    {
      name: 'can create networking:CLEAR_WIFI_STATUS',
      creator: Actions.clearWifiStatus,
      args: [mockRobot.name],
      expected: {
        type: 'networking:CLEAR_WIFI_STATUS',
        payload: { robotName: mockRobot.name },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
