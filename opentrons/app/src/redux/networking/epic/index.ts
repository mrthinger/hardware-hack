import { combineEpics } from 'redux-observable'

import { fetchEapOptionsEpic } from './fetchEapOptionsEpic'
import { fetchWifiKeysEpic } from './fetchWifiKeysEpic'
import { postWifiKeysEpic } from './postWifiKeysEpic'
import { statusEpic } from './statusEpic'
import { wifiConfigureEpic } from './wifiConfigureEpic'
import { disconnectEpic } from './disconnectEpic'

import type { Epic } from '../../types'

export const networkingEpic: Epic = combineEpics<Epic>(
  fetchEapOptionsEpic,
  fetchWifiKeysEpic,
  postWifiKeysEpic,
  statusEpic,
  wifiConfigureEpic,
  disconnectEpic
)
