import type { AddressableAreaName } from '../../deck'
import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
export type PipettingRunTimeCommand =
  | AspirateInPlaceRunTimeCommand
  | AspirateInPlaceRunTimeCommand
  | AspirateRunTimeCommand
  | BlowoutInPlaceRunTimeCommand
  | BlowoutRunTimeCommand
  | ConfigureForVolumeRunTimeCommand
  | DispenseInPlaceRunTimeCommand
  | DispenseRunTimeCommand
  | DropTipInPlaceRunTimeCommand
  | DropTipRunTimeCommand
  | GetTipPresenceRunTimeCommand
  | MoveToAddressableAreaForDropTipRunTimeCommand
  | PickUpTipRunTimeCommand
  | PrepareToAspirateRunTimeCommand
  | TouchTipRunTimeCommand
  | VerifyTipPresenceRunTimeCommand

export type PipettingCreateCommand =
  | AspirateCreateCommand
  | AspirateInPlaceCreateCommand
  | BlowoutCreateCommand
  | BlowoutInPlaceCreateCommand
  | ConfigureForVolumeCreateCommand
  | DispenseCreateCommand
  | DispenseInPlaceCreateCommand
  | DropTipCreateCommand
  | DropTipInPlaceCreateCommand
  | GetTipPresenceCreateCommand
  | MoveToAddressableAreaForDropTipCreateCommand
  | PickUpTipCreateCommand
  | PrepareToAspirateCreateCommand
  | TouchTipCreateCommand
  | VerifyTipPresenceCreateCommand

export interface ConfigureForVolumeCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'configureForVolume'
  params: ConfigureForVolumeParams
}

export interface ConfigureForVolumeParams {
  pipetteId: string
  volume: number
}
export interface ConfigureForVolumeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    ConfigureForVolumeCreateCommand {
  result?: BasicLiquidHandlingResult
}
export interface AspirateCreateCommand extends CommonCommandCreateInfo {
  commandType: 'aspirate'
  params: AspDispAirgapParams
}
export interface AspirateRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AspirateCreateCommand {
  result?: BasicLiquidHandlingResult
}

export interface AspirateInPlaceCreateCommand extends CommonCommandCreateInfo {
  commandType: 'aspirateInPlace'
  params: AspirateInPlaceParams
}
export interface AspirateInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    AspirateInPlaceCreateCommand {
  result?: BasicLiquidHandlingResult
}

export type DispenseParams = AspDispAirgapParams & { pushOut?: number }
export interface DispenseCreateCommand extends CommonCommandCreateInfo {
  commandType: 'dispense'
  params: DispenseParams
}
export interface DispenseRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DispenseCreateCommand {
  result?: BasicLiquidHandlingResult
}

export interface DispenseInPlaceCreateCommand extends CommonCommandCreateInfo {
  commandType: 'dispenseInPlace'
  params: DispenseInPlaceParams
}
export interface DispenseInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DispenseInPlaceCreateCommand {
  result?: BasicLiquidHandlingResult
}

export interface BlowoutCreateCommand extends CommonCommandCreateInfo {
  commandType: 'blowout'
  params: BlowoutParams
}
export interface BlowoutRunTimeCommand
  extends CommonCommandRunTimeInfo,
    BlowoutCreateCommand {
  result?: BasicLiquidHandlingResult
}
export interface BlowoutInPlaceCreateCommand extends CommonCommandCreateInfo {
  commandType: 'blowOutInPlace'
  params: BlowoutInPlaceParams
}
export interface BlowoutInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    BlowoutInPlaceCreateCommand {
  result?: BasicLiquidHandlingResult
}

export interface TouchTipCreateCommand extends CommonCommandCreateInfo {
  commandType: 'touchTip'
  params: TouchTipParams
}
export interface TouchTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    TouchTipCreateCommand {
  result?: BasicLiquidHandlingResult
}
export interface PickUpTipCreateCommand extends CommonCommandCreateInfo {
  commandType: 'pickUpTip'
  params: PickUpTipParams
}
export interface PickUpTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    PickUpTipCreateCommand {
  result?: any
}
export interface DropTipCreateCommand extends CommonCommandCreateInfo {
  commandType: 'dropTip'
  params: DropTipParams
}
export interface DropTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DropTipCreateCommand {
  result?: any
}
export interface DropTipInPlaceCreateCommand extends CommonCommandCreateInfo {
  commandType: 'dropTipInPlace'
  params: DropTipInPlaceParams
}
export interface DropTipInPlaceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    DropTipInPlaceCreateCommand {
  result?: any
}

export interface MoveToAddressableAreaForDropTipCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'moveToAddressableAreaForDropTip'
  params: MoveToAddressableAreaForDropTipParams
}
export interface MoveToAddressableAreaForDropTipRunTimeCommand
  extends CommonCommandRunTimeInfo,
    MoveToAddressableAreaForDropTipCreateCommand {
  result?: any
}

export interface PrepareToAspirateCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'prepareToAspirate'
  params: PipetteIdentityParams
}

export interface PrepareToAspirateRunTimeCommand
  extends CommonCommandRunTimeInfo,
    PrepareToAspirateCreateCommand {
  result?: any
}

export interface GetTipPresenceCreateCommand extends CommonCommandCreateInfo {
  commandType: 'getTipPresence'
  params: PipetteIdentityParams
}

export interface GetTipPresenceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    GetTipPresenceCreateCommand {
  result?: TipPresenceResult
}

export interface VerifyTipPresenceCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'verifyTipPresence'
  params: VerifyTipPresenceParams
}

export interface VerifyTipPresenceRunTimeCommand
  extends CommonCommandRunTimeInfo,
    VerifyTipPresenceCreateCommand {
  result?: any
}

export type AspDispAirgapParams = FlowRateParams &
  PipetteAccessParams &
  VolumeParams &
  WellLocationParam
export type BlowoutParams = FlowRateParams &
  PipetteAccessParams &
  WellLocationParam
export type TouchTipParams = PipetteAccessParams & WellLocationParam
export type DropTipParams = PipetteAccessParams & {
  wellLocation?: {
    origin?: 'default' | 'top' | 'center' | 'bottom'
    offset?: {
      // mm values all default to 0
      x?: number
      y?: number
      z?: number
    }
  }
}
export type PickUpTipParams = TouchTipParams

interface AddressableOffsetVector {
  x: number
  y: number
  z: number
}
export interface DropTipInPlaceParams {
  pipetteId: string
}

export interface MoveToAddressableAreaForDropTipParams {
  pipetteId: string
  addressableAreaName: AddressableAreaName
  offset?: AddressableOffsetVector
  alternateDropLocation?: boolean
  speed?: number
  minimumZHeight?: number
  forceDirect?: boolean
}
export interface BlowoutInPlaceParams {
  pipetteId: string
  flowRate: number // µL/s
}

export interface DispenseInPlaceParams {
  pipetteId: string
  volume: number
  flowRate: number // µL/s
  pushOut?: number
}

export interface AspirateInPlaceParams {
  pipetteId: string
  volume: number
  flowRate: number // µL/s
}
interface FlowRateParams {
  flowRate: number // µL/s
}

interface PipetteIdentityParams {
  pipetteId: string
}

interface PipetteAccessParams extends PipetteIdentityParams {
  labwareId: string
  wellName: string
}

interface VolumeParams {
  volume: number // µL
}

interface WellLocationParam {
  wellLocation?: {
    // default value is 'top'
    origin?: 'top' | 'center' | 'bottom'
    offset?: {
      // mm
      // all values default to 0
      x?: number
      y?: number
      z?: number
    }
  }
}

interface VerifyTipPresenceParams extends PipetteIdentityParams {
  expectedState?: 'present' | 'absent'
  followSingularSensor?: 'primary' | 'secondary'
}

interface BasicLiquidHandlingResult {
  volume: number // Amount of liquid in uL handled in the operation
}

interface TipPresenceResult {
  // ot2 should alwasy return unknown
  status?: 'present' | 'absent' | 'unknown'
}
