import { beforeEach, describe, it, expect } from 'vitest'
import { expectTimelineError } from '../__utils__/testMatchers'
import { touchTip } from '../commandCreators/atomic/touchTip'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

describe('touchTip', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })

  it('touchTip with tip, specifying offsetFromBottomMm', () => {
    const result = touchTip(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      {
        commandType: 'touchTip',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 10,
            },
          },
        },
      },
    ])
  })

  it('touchTip with invalid pipette ID should throw error', () => {
    const result = touchTip(
      {
        pipette: 'badPipette',
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expectTimelineError(res.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  it('touchTip with no tip should throw error', () => {
    const result = touchTip(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      initialRobotState
    )
    const res = getErrorResult(result)

    expect(res.errors).toEqual([
      {
        message:
          "Attempted to touchTip with no tip on pipette: p300SingleId from sourcePlateId's well A1",
        type: 'NO_TIP_ON_PIPETTE',
      },
    ])
  })
})
