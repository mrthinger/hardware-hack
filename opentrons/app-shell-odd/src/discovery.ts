// app shell discovery module
import { app } from 'electron'
import Store from 'electron-store'
import groupBy from 'lodash/groupBy'
import throttle from 'lodash/throttle'

import {
  createDiscoveryClient,
  DEFAULT_PORT,
} from '@opentrons/discovery-client'

import {
  UI_INITIALIZED,
  DISCOVERY_START,
  DISCOVERY_FINISH,
  DISCOVERY_REMOVE,
  CLEAR_CACHE,
} from './constants'

import { getFullConfig, handleConfigChange } from './config'
import { createLogger } from './log'

import type {
  Address,
  DiscoveryClientRobot,
  LegacyService,
  DiscoveryClient,
} from '@opentrons/discovery-client'

import type { Action, Dispatch } from './types'
import type { ConfigV1 } from '@opentrons/app/src/redux/config/schema-types'

const log = createLogger('discovery')

// TODO(mc, 2018-08-09): values picked arbitrarily and should be researched
const FAST_POLL_INTERVAL_MS = 3000
const SLOW_POLL_INTERVAL_MS = 15000
const UPDATE_THROTTLE_MS = 500

interface DiscoveryStore {
  robots: DiscoveryClientRobot[]
  services?: LegacyService[]
}

let config: ConfigV1['discovery']
let store: Store<DiscoveryStore>
let client: DiscoveryClient

const makeManualAddresses = (addrs: string | string[]): Address[] => {
  return ['fd00:0:cafe:fefe::1']
    .concat(addrs)
    .map(ip => ({ ip, port: DEFAULT_PORT }))
}

const migrateLegacyServices = (
  legacyServices: LegacyService[]
): DiscoveryClientRobot[] => {
  const servicesByName = groupBy<LegacyService>(legacyServices, 'name')

  return Object.keys(servicesByName).map((name: string) => {
    const services = servicesByName[name]
    const addresses = services.flatMap((service: LegacyService) => {
      const { ip, port } = service
      return ip != null
        ? [
            {
              ip,
              port,
              seen: false,
              healthStatus: null,
              serverHealthStatus: null,
              healthError: null,
              serverHealthError: null,
              advertisedModel: null,
            },
          ]
        : []
    })

    return { name, health: null, serverHealth: null, addresses }
  })
}

export function registerDiscovery(
  dispatch: Dispatch
): (action: Action) => unknown {
  const handleRobotListChange = throttle(handleRobots, UPDATE_THROTTLE_MS)

  config = getFullConfig().discovery
  store = new Store({
    name: 'discovery',
    defaults: { robots: [] as DiscoveryClientRobot[] },
  })

  let disableCache = config.disableCache
  let initialRobots: DiscoveryClientRobot[] = []

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!disableCache) {
    const legacyCachedServices: LegacyService[] | undefined = store.get(
      'services',
      // @ts-expect-error(mc, 2021-02-16): tweak these type definitions
      null
    )

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (legacyCachedServices) {
      initialRobots = migrateLegacyServices(legacyCachedServices)
      store.delete('services')
    } else {
      initialRobots = store.get('robots', [])
    }
  }

  client = createDiscoveryClient({
    onListChange: handleRobotListChange,
    logger: log,
    enableMDNS: false,
  })

  client.start({
    initialRobots,
    healthPollInterval: SLOW_POLL_INTERVAL_MS,
    manualAddresses: makeManualAddresses(config.candidates),
  })

  handleConfigChange('discovery.candidates', (value: string | string[]) => {
    client.start({ manualAddresses: makeManualAddresses(value) })
  })

  handleConfigChange('discovery.disableCache', (value: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    if (value === true) {
      disableCache = value
      store.set('robots', [])
      clearCache()
    }
  })

  app.once('will-quit', () => {
    client.stop()
  })

  return function handleIncomingAction(action: Action) {
    log.debug('handling action in discovery', { action })

    switch (action.type) {
      case UI_INITIALIZED:
      case DISCOVERY_START: {
        handleRobots()
        client.start({ healthPollInterval: FAST_POLL_INTERVAL_MS })
        return
      }

      case DISCOVERY_FINISH: {
        client.start({ healthPollInterval: SLOW_POLL_INTERVAL_MS })
        return
      }

      case DISCOVERY_REMOVE: {
        client.removeRobot((action.payload as { robotName: string }).robotName)
        return
      }

      case CLEAR_CACHE: {
        clearCache()
      }
    }
  }

  function handleRobots(): void {
    const robots = client.getRobots()

    if (!disableCache) store.set('robots', robots)

    dispatch({
      type: 'discovery:UPDATE_LIST',
      payload: { robots },
    })
  }

  function clearCache(): void {
    client.start({ initialRobots: [] })
  }
}
