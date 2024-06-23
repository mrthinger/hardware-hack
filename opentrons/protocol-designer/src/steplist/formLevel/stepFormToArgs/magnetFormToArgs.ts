import type {
  EngageMagnetArgs,
  DisengageMagnetArgs,
} from '@opentrons/step-generation'
import type { HydratedMagnetFormData } from '../../../form-types'
type MagnetArgs = EngageMagnetArgs | DisengageMagnetArgs
export const magnetFormToArgs = (
  hydratedFormData: HydratedMagnetFormData
): MagnetArgs => {
  const { magnetAction, moduleId } = hydratedFormData
  // @ts-expect-error(sa, 2021-6-14): null check engageHeight
  const engageHeight = parseFloat(hydratedFormData.engageHeight)
  console.assert(
    magnetAction === 'engage' ? !Number.isNaN(engageHeight) : true,
    'magnetFormToArgs expected (hydrated) engageHeight to be non-NaN if magnetAction is "engage"'
  )

  if (magnetAction === 'engage' && !Number.isNaN(engageHeight)) {
    return {
      commandCreatorFnName: 'engageMagnet',
      // @ts-expect-error(sa, 2021-6-14): perform null check on moduleId
      module: moduleId,
      engageHeight,
    }
  } else {
    return {
      commandCreatorFnName: 'disengageMagnet',
      // @ts-expect-error(sa, 2021-6-14): perform null check on moduleId
      module: moduleId,
    }
  }
}
