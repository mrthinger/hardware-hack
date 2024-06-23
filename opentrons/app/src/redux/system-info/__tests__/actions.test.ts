import { describe, it, expect } from 'vitest'

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'
import type { SystemInfoAction } from '../types'

interface ActionSpec {
  should: string
  creator: (...args: any[]) => SystemInfoAction
  args: any[]
  expected: SystemInfoAction
}

const SPECS: ActionSpec[] = [
  {
    should: 'create a systemInfo:USB_DEVICE_ADDED action',
    creator: Actions.usbDeviceAdded,
    args: [Fixtures.mockUsbDevice],
    expected: {
      type: 'systemInfo:USB_DEVICE_ADDED',
      payload: { usbDevice: Fixtures.mockUsbDevice },
      meta: { shell: true },
    },
  },
  {
    should: 'create a systemInfo:USB_DEVICE_REMOVED action',
    creator: Actions.usbDeviceRemoved,
    args: [Fixtures.mockUsbDevice],
    expected: {
      type: 'systemInfo:USB_DEVICE_REMOVED',
      payload: { usbDevice: Fixtures.mockUsbDevice },
      meta: { shell: true },
    },
  },
  {
    should: 'create a systemInfo:INITIALIZED action',
    creator: Actions.initialized,
    args: [
      [Fixtures.mockUsbDevice, Fixtures.mockUsbDevice, Fixtures.mockUsbDevice],
      [Fixtures.mockNetworkInterface],
    ],
    expected: {
      type: 'systemInfo:INITIALIZED',
      payload: {
        usbDevices: [
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
          Fixtures.mockUsbDevice,
        ],
        networkInterfaces: [Fixtures.mockNetworkInterface],
      },
      meta: { shell: true },
    },
  },
  {
    should: 'create a systemInfo:NETWORK_INTERFACES_CHANGED action',
    creator: Actions.networkInterfacesChanged,
    args: [[Fixtures.mockNetworkInterface]],
    expected: {
      type: 'systemInfo:NETWORK_INTERFACES_CHANGED',
      payload: {
        networkInterfaces: [Fixtures.mockNetworkInterface],
      },
    },
  },
]

describe('system-info actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(`should ${should}`, () => expect(creator(...args)).toEqual(expected))
  })
})
