import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import type { RobotState } from '../'
export const thermocyclerPipetteCollision = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareSlot: string = labware[labwareId]?.slot
  const moduleUnderLabware: string | null | undefined =
    modules &&
    labwareSlot &&
    Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)
  const moduleState =
    moduleUnderLabware && modules[moduleUnderLabware].moduleState
  const isTCLidClosed: boolean = Boolean(
    moduleState &&
      moduleState.type === THERMOCYCLER_MODULE_TYPE &&
      moduleState.lidOpen !== true
  )
  return isTCLidClosed
}
