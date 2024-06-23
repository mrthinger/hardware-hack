import { useSelector } from 'react-redux'

import { getFeatureFlags } from './selectors'

import type { State } from '../types'
import type { DevInternalFlag } from './types'

export const useFeatureFlag = (flag: DevInternalFlag): boolean => {
  return useSelector((state: State) => {
    const featureFlags = getFeatureFlags(state)
    return Boolean(featureFlags[flag])
  })
}
