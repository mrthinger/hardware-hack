// system-info helpers and utilities

import { NOT_APPLICABLE, UNKNOWN, UP_TO_DATE, OUTDATED } from './constants'

import type { UsbDevice, DriverStatus } from './types'

// NOTE(mc, 2020-05-05): this will cause false alerts on Windows 7; Realtek's
// versioning scheme seems to be WindowsVersion.Something.Something.Something
// TODO(mc, 2020-05-06): move to config once migrations are addressed
// https://github.com/Opentrons/opentrons/issues/5587
// NOTE(mc, 2020-05-26): Realtek has an inconsistent versioning scheme
// so we only check the first two version segments to avoid false alerts
//  - Driver version as of 2020-04-12: 10.38.117.2020
//  - Driver version as of 2020-05-20: 10.38.20.117
const REALTEK_UP_TO_DATE_VERSION = [10, 38]

// Our U2E adapter should have the following properties:
// Vendor ID: 0x0BDA, Product ID: 0x8150
// NOTE(mc, 2020-05-20): our device erroneously reports a PID of 0x8050
const REALTEK_VID = parseInt('0BDA', 16)
const RE_REALTEK_PID = /^8[0|1]5[0-9]$/

export const isRealtekU2EAdapter = (device: UsbDevice): boolean => {
  return (
    device.vendorId === REALTEK_VID &&
    RE_REALTEK_PID.test(device.productId.toString(16))
  )
}

export const getDriverStatus = (device: UsbDevice): DriverStatus => {
  const { windowsDriverVersion } = device
  if (
    !isRealtekU2EAdapter(device) ||
    typeof windowsDriverVersion === 'undefined'
  ) {
    return NOT_APPLICABLE
  }

  if (windowsDriverVersion === null) return UNKNOWN

  const versionParts = windowsDriverVersion.split('.').map(s => Number(s))
  if (!versionParts.every(p => Number.isFinite(p))) return UNKNOWN

  const upToDate = REALTEK_UP_TO_DATE_VERSION.reduce<boolean | null>(
    (result, subversion, index, collection) => {
      if (result === null) {
        const target = versionParts[index] ?? 0
        if (target > subversion) return true
        if (target < subversion) return false
        if (index === collection.length - 1) return target >= subversion
      }

      return result
    },
    null
  )

  return upToDate ? UP_TO_DATE : OUTDATED
}
