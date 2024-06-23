import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { AspirateInPlaceArgs } from '../commandCreators/atomic/aspirateInPlace'
import type { BlowOutInPlaceArgs } from '../commandCreators/atomic/blowOutInPlace'
import type { DispenseInPlaceArgs } from '../commandCreators/atomic/dispenseInPlace'
import type { DropTipInPlaceArgs } from '../commandCreators/atomic/dropTipInPlace'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forAspirateInPlace = (
  params: AspirateInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  //  aspirateInPlace is only used for air_gap so there are no state
  //  updates
}

export const forDispenseInPlace = (
  params: DispenseInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId, volume } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: false,
    volume,
    robotStateAndWarnings,
  })
}

export const forBlowOutInPlace = (
  params: BlowOutInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: true,
    robotStateAndWarnings,
  })
}

export const forDropTipInPlace = (
  params: DropTipInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  robotState.tipState.pipettes[pipetteId] = false

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    useFullVolume: true,
    robotStateAndWarnings,
  })
}
