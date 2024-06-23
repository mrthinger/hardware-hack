import { createSelector } from 'reselect'
import { SLEEP_NEVER_MS } from '../../App/constants'
import type { State } from '../types'
import type {
  Config,
  FeatureFlags,
  UpdateChannel,
  ProtocolsOnDeviceSortKey,
  OnDeviceDisplaySettings,
} from './types'
import type { SelectOption } from '../../atoms/SelectField/Select'
import type { ProtocolSort } from '../../organisms/ProtocolsLanding/hooks'

export const getConfig = (state: State): Config | null => state.config

export const getApplyHistoricOffsets: (
  state: State
) => boolean = createSelector(
  getConfig,
  config => config?.protocols.applyHistoricOffsets ?? true
)

export const getDevtoolsEnabled = (state: State): boolean => {
  return state.config?.devtools ?? false
}

export const getFeatureFlags = (state: State): FeatureFlags => {
  return state.config?.devInternal ?? {}
}

export const getUpdateChannel = (state: State): UpdateChannel => {
  return state.config?.update.channel ?? 'latest'
}

export const getHasJustUpdated = (state: State): boolean => {
  return state.config?.update.hasJustUpdated ?? false
}

export const getUseTrashSurfaceForTipCal = (state: State): boolean | null => {
  return state.config?.calibration.useTrashSurfaceForTipCal ?? null
}

export const getHasCalibrationBlock = (state: State): boolean | null => {
  const useTrashSurface = getUseTrashSurfaceForTipCal(state)
  return useTrashSurface === null ? null : !useTrashSurface
}

export const getIsHeaterShakerAttached = (state: State): boolean => {
  return state.config?.modules.heaterShaker.isAttached ?? false
}

export const getIsLabwareOffsetCodeSnippetsOn = (state: State): boolean => {
  return state.config?.labware.showLabwareOffsetCodeSnippets ?? false
}

export const getPathToPythonOverride: (
  state: State
) => string | null = createSelector(
  getConfig,
  config => config?.python.pathToPythonOverride ?? null
)

const UPDATE_CHANNEL_OPTS = [
  { label: 'Stable', value: 'latest' as UpdateChannel },
  { label: 'Beta', value: 'beta' as UpdateChannel },
]

const UPDATE_CHANNEL_OPTS_WITH_ALPHA = [
  ...UPDATE_CHANNEL_OPTS,
  { label: 'Alpha', value: 'alpha' as UpdateChannel },
]

export const getUpdateChannelOptions = (state: State): SelectOption[] => {
  return state.config?.devtools || state.config?.update.channel === 'alpha'
    ? UPDATE_CHANNEL_OPTS_WITH_ALPHA
    : UPDATE_CHANNEL_OPTS
}

export const getIsOnDevice: (state: State) => boolean = createSelector(
  getConfig,
  config => !!(config?.isOnDevice ?? false)
)

export const getProtocolsDesktopSortKey: (
  state: State
) => ProtocolSort | null = createSelector(
  getConfig,
  config => config?.protocols.protocolsStoredSortKey ?? null
)

export const getProtocolsOnDeviceSortKey: (
  state: State
) => ProtocolsOnDeviceSortKey | null = createSelector(
  getConfig,
  config => config?.protocols.protocolsOnDeviceSortKey ?? null
)

export const getPinnedProtocolIds: (
  state: State
) => string[] | undefined = createSelector(
  getConfig,
  config => config?.protocols.pinnedProtocolIds
)

export const getOnDeviceDisplaySettings: (
  state: State
) => OnDeviceDisplaySettings = createSelector(getConfig, config => {
  if (config?.onDeviceDisplaySettings != null) {
    return {
      ...config.onDeviceDisplaySettings,
      unfinishedUnboxingFlowRoute:
        // @ts-expect-error special casing 0 because there is no null type that gnu make can provide at build time
        // see dev-shell-odd in app/Makefile (we provide 0 instead of null)
        config.onDeviceDisplaySettings.unfinishedUnboxingFlowRoute !== 0
          ? config?.onDeviceDisplaySettings.unfinishedUnboxingFlowRoute
          : null,
    }
  }
  return {
    sleepMs: SLEEP_NEVER_MS,
    brightness: 4,
    textSize: 1,
    unfinishedUnboxingFlowRoute: '/welcome',
  }
})
