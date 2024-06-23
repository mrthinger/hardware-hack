import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import { thermocyclerWaitForLidTemperature } from '../atomic/thermocyclerWaitForLidTemperature'
import { thermocyclerRunProfile } from '../atomic/thermocyclerRunProfile'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerStateStep } from './thermocyclerStateStep'
import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerProfileStepArgs,
} from '../../types'
export const thermocyclerProfileStep: CommandCreator<ThermocyclerProfileStepArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    blockTargetTempHold,
    lidTargetTempHold,
    lidOpenHold,
    module: moduleId,
    profileSteps,
    profileTargetLidTemp,
    profileVolume,
  } = args
  const thermocyclerState = thermocyclerStateGetter(prevRobotState, moduleId)

  if (thermocyclerState === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const commandCreators: CurriedCommandCreator[] = []

  if (thermocyclerState.lidOpen !== false) {
    commandCreators.push(
      curryCommandCreator(thermocyclerCloseLid, {
        module: moduleId,
      })
    )
  }

  if (profileTargetLidTemp !== thermocyclerState.lidTargetTemp) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetLidTemperature, {
        module: moduleId,
        temperature: profileTargetLidTemp,
      })
    )
    commandCreators.push(
      curryCommandCreator(thermocyclerWaitForLidTemperature, {
        module: moduleId,
        temperature: profileTargetLidTemp,
      })
    )
  }

  commandCreators.push(
    curryCommandCreator(thermocyclerRunProfile, {
      module: moduleId,
      profile: profileSteps,
      volume: profileVolume,
    })
  )

  commandCreators.push(
    curryCommandCreator(thermocyclerStateStep, {
      commandCreatorFnName: 'thermocyclerState',
      module: moduleId,
      blockTargetTemp: blockTargetTempHold,
      lidTargetTemp: lidTargetTempHold,
      lidOpen: lidOpenHold,
    })
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
