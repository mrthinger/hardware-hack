import {
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, DeactivateTemperatureArgs } from '../../types'

/** Disengage temperature target for specified module. */
export const deactivateTemperature: CommandCreator<DeactivateTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module } = args

  if (module === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const moduleType = invariantContext.moduleEntities[module]?.type
  const params = {
    moduleId: module,
  }

  if (moduleType === TEMPERATURE_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'temperatureModule/deactivate',
          key: uuid(),
          params,
        },
      ],
    }
  } else if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'thermocycler/deactivateLid',
          key: uuid(),
          params,
        },
        {
          commandType: 'thermocycler/deactivateBlock',
          key: uuid(),
          params,
        },
      ],
    }
  } else if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'heaterShaker/deactivateHeater',
          key: uuid(),
          params,
        },
      ],
    }
  } else {
    console.error(
      `setTemperature expected module ${module} to be ${TEMPERATURE_MODULE_TYPE}, ${THERMOCYCLER_MODULE_TYPE} or ${HEATERSHAKER_MODULE_TYPE}, got ${moduleType}`
    )
    // NOTE: "missing module" isn't exactly the right error here, but better than a whitescreen!
    // This should never be shown.
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
}
