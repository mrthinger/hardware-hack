import { describe, it, expect } from 'vitest'

import {
  getRelevantWellName,
  getRelevantFailedLabwareCmdFrom,
} from '../useFailedLabwareUtils'
import { ERROR_KINDS, DEFINED_ERROR_TYPES } from '../../constants'

describe('getRelevantWellName', () => {
  const failedPipetteInfo = {
    data: {
      channels: 8,
    },
  } as any

  const recentRelevantPickUpTipCmd = {
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'labwareId',
      wellName: 'A1',
    },
  } as any

  it('should return an empty string if failedPipetteInfo is null', () => {
    const result = getRelevantWellName(null, recentRelevantPickUpTipCmd)
    expect(result).toBe('')
  })

  it('should return an empty string if recentRelevantPickUpTipCmd is null', () => {
    const result = getRelevantWellName(failedPipetteInfo, null)
    expect(result).toBe('')
  })

  it('should return the wellName if the pipette has 1 channel', () => {
    const result = getRelevantWellName(
      { ...failedPipetteInfo, data: { channels: 1 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should return a range of well names if the pipette has 8 channels', () => {
    const result = getRelevantWellName(
      failedPipetteInfo,
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1 - H1')
  })

  it('should return the wellName if the pipette has 96 channels', () => {
    const result = getRelevantWellName(
      { ...failedPipetteInfo, data: { channels: 96 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should handle different wellName formats correctly', () => {
    const result = getRelevantWellName(failedPipetteInfo, {
      ...recentRelevantPickUpTipCmd,
      params: { ...recentRelevantPickUpTipCmd.params, wellName: 'B12' },
    })
    expect(result).toBe('A12 - H12')
  })
})

describe('getRelevantFailedLabwareCmdFrom', () => {
  const failedCommand = {
    error: {
      errorType: DEFINED_ERROR_TYPES.NO_LIQUID_DETECTED,
    },
    params: {
      wellName: 'A1',
      pipetteId: 'pipetteId',
    },
  } as any

  it('should return the failedCommand for NO_LIQUID_DETECTED error kind', () => {
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: {
        ...failedCommand,
        error: { errorType: DEFINED_ERROR_TYPES.NO_LIQUID_DETECTED },
      },
    })
    expect(result).toEqual(failedCommand)
  })

  it('should return the relevant pickUpTip command for overpressure error kinds', () => {
    const pickUpTipCommand = {
      commandType: 'pickUpTip',
      params: {
        pipetteId: 'pipetteId',
        labwareId: 'labwareId',
        wellName: 'A1',
      },
    } as any
    const runCommands = {
      data: [pickUpTipCommand, failedCommand],
    } as any

    const overpressureErrorKinds = [
      [
        ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE,
        DEFINED_ERROR_TYPES.PIPETTE_COLLISION,
      ],
      [
        ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING,
        DEFINED_ERROR_TYPES.OVERPRESSURE_ASPIRATION,
      ],
      [
        ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING,
        DEFINED_ERROR_TYPES.OVERPRESSURE_DISPENSING,
      ],
    ]

    overpressureErrorKinds.forEach(([errorKind, errorType]) => {
      const result = getRelevantFailedLabwareCmdFrom({
        failedCommand: { ...failedCommand, error: { errorType } },
        runCommands,
      })
      expect(result).toBe(pickUpTipCommand)
    })
  })
  it('should return null for GENERAL_ERROR error kind', () => {
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: {
        ...failedCommand,
        error: { errorType: 'literally anything else' },
      },
    })
    expect(result).toBeNull()
  })

  it('should return null for unhandled error kinds', () => {
    const result = getRelevantFailedLabwareCmdFrom({
      failedCommand: {
        ...failedCommand,
        error: { errorType: 'SOME_UNHANDLED_ERROR' },
      },
    })
    expect(result).toBeNull()
  })
})
