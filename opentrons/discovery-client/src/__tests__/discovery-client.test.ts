import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import {
  mockLegacyHealthResponse,
  mockLegacyServerHealthResponse,
  mockOT2HealthResponse,
  mockOT2ServerHealthResponse,
  mockOT3HealthResponse,
  mockOT3ServerHealthResponse,
} from '../fixtures'
import { HEALTH_STATUS_OK } from '../constants'
import * as HealthPollerModule from '../health-poller'
import * as MdnsBrowserModule from '../mdns-browser'
import { createDiscoveryClient } from '..'

import type { HealthPollerResult, Logger } from '../types'
import type { MdnsBrowserService } from '../mdns-browser'

vi.mock('../health-poller')
vi.mock('../mdns-browser')

const createHealthPoller = HealthPollerModule.createHealthPoller
const createMdnsBrowser = MdnsBrowserModule.createMdnsBrowser
const logger = ({} as unknown) as Logger

describe('discovery client', () => {
  const onListChange = vi.fn()

  const healthPoller: {
    start: any
    stop: any
  } = {
    start: vi.fn(),
    stop: vi.fn(),
  }

  const mdnsBrowser: {
    start: any
    stop: any
  } = {
    start: vi.fn(),
    stop: vi.fn(),
  }

  const emitPollResult = (result: HealthPollerResult): void => {
    //  @ts-expect-error: mock doesn't exist on type
    const { onPollResult } = createHealthPoller.mock.calls[
      //  @ts-expect-error: mock doesn't exist on type
      createHealthPoller.mock.calls.length - 1
    ][0]
    onPollResult(result)
  }

  const emitService = (service: MdnsBrowserService): void => {
    //  @ts-expect-error: mock doesn't exist on type
    const { onService } = createMdnsBrowser.mock.calls[
      //  @ts-expect-error: mock doesn't exist on type

      createMdnsBrowser.mock.calls.length - 1
    ][0]
    onService(service)
  }

  beforeEach(() => {
    vi.mocked(createHealthPoller).mockReturnValue(healthPoller)
    vi.mocked(createMdnsBrowser).mockReturnValue(mdnsBrowser)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should create an mDNS browser and health poller', () => {
    createDiscoveryClient({ onListChange, logger })

    expect(createHealthPoller).toHaveBeenCalledWith({
      onPollResult: expect.any(Function),
      logger,
    })

    expect(createMdnsBrowser).toHaveBeenCalledWith({
      ports: [31950],
      onService: expect.any(Function),
      logger,
    })
  })

  it('should start the mDNS browser and health poller when started', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    expect(healthPoller.start).toHaveBeenCalledWith({
      list: [],
      interval: 5000,
    })
    expect(mdnsBrowser.start).toHaveBeenCalled()
  })

  it('should be able to restart with a new poll interval', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    client.start({ healthPollInterval: 6000 })
    expect(healthPoller.start).toHaveBeenLastCalledWith({
      list: [],
      interval: 6000,
    })
  })

  it('should add a robot to the list when an mDNS service is found', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: 'OT-3 Standard',
    })

    expect(onListChange).toHaveBeenCalledWith([
      {
        name: 'opentrons-dev',
        health: null,
        serverHealth: null,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: null,
            serverHealthStatus: null,
            healthError: null,
            serverHealthError: null,
            advertisedModel: 'OT-3 Standard',
          },
        ],
      },
    ])
  })

  it('should update a robot in the list when an poll completes', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })
    emitPollResult({
      ip: '127.0.0.1',
      port: 31950,
      health: mockLegacyHealthResponse,
      serverHealth: mockLegacyServerHealthResponse,
      healthError: null,
      serverHealthError: null,
    })

    expect(onListChange).toHaveBeenLastCalledWith([
      {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: null,
          },
        ],
      },
    ])
  })

  it('should not re-notify if no change', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: 'OT-2 Standard',
    })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: 'OT-2 Standard',
    })

    expect(onListChange).toHaveBeenCalledTimes(1)
  })

  it('should restart the poller when an mDNS service is found', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: 'OT-3 Standard',
    })

    expect(healthPoller.start).toHaveBeenLastCalledWith({
      list: [{ ip: '127.0.0.1', port: 31950 }],
    })
  })

  it('should only restart the poller if IP information changed', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({ healthPollInterval: 5000 })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })

    expect(healthPoller.start).toHaveBeenCalledTimes(2)
  })

  it('should be able to stop', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({})
    client.stop()

    expect(healthPoller.stop).toHaveBeenCalled()
    expect(mdnsBrowser.stop).toHaveBeenCalled()
  })

  it('should not emit robot lists nor restart poller while stopped', () => {
    const client = createDiscoveryClient({ onListChange, logger })

    client.start({})
    client.stop()
    onListChange.mockClear()
    healthPoller.start.mockClear()

    // this shouldn't happen while the mDNS browser stopped but is useful to testing
    emitService({
      name: 'opentrons-dev',
      ip: '127.0.0.1',
      port: 31950,
      robotModel: null,
    })

    expect(onListChange).toHaveBeenCalledTimes(0)
    expect(healthPoller.start).toHaveBeenCalledTimes(0)
  })

  it('should be able to start with a pre-populated list of robots', () => {
    const client = createDiscoveryClient({ onListChange, logger })
    const initialRobots = [
      {
        name: 'opentrons-dev',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: 'OT-3 Standard',
          },
        ],
      },
    ]

    client.start({ initialRobots })

    expect(healthPoller.start).toHaveBeenLastCalledWith({
      list: [{ ip: '127.0.0.1', port: 31950 }],
    })

    expect(client.getRobots()).toEqual([
      {
        name: 'opentrons-dev',
        health: mockOT3HealthResponse,
        serverHealth: mockOT3ServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: false,
            healthStatus: null,
            serverHealthStatus: null,
            healthError: null,
            serverHealthError: null,
            advertisedModel: 'OT-3 Standard',
          },
        ],
      },
    ])
  })

  it('should be able to re-start gracefully', () => {
    const client = createDiscoveryClient({ onListChange, logger })
    const initialRobots = [
      {
        name: 'opentrons-dev',
        health: mockOT2HealthResponse,
        serverHealth: mockOT2ServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: 'OT-2 Standard',
          },
        ],
      },
    ]

    client.start({ initialRobots })
    client.start({ initialRobots: [] })

    expect(onListChange).toHaveBeenCalledTimes(1)
    expect(onListChange).toHaveBeenCalledWith([])
  })

  it('should be able to start with an extra set of IP addresses to poll', () => {
    const client = createDiscoveryClient({ onListChange, logger })
    const manualAddresses = [
      { ip: 'localhost', port: 31950 },
      { ip: '192.168.1.42', port: 31950 },
    ]

    client.start({ manualAddresses })

    expect(healthPoller.start).toHaveBeenCalledWith({
      list: [
        { ip: 'localhost', port: 31950 },
        { ip: '192.168.1.42', port: 31950 },
      ],
    })
  })

  it('should be able to manually remove a robot', () => {
    const client = createDiscoveryClient({ onListChange, logger })
    const initialRobots = [
      {
        name: 'opentrons-dev',
        health: mockLegacyHealthResponse,
        serverHealth: mockLegacyServerHealthResponse,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: null,
          },
          {
            ip: '127.0.0.2',
            port: 31950,
            seen: true,
            healthStatus: HEALTH_STATUS_OK,
            serverHealthStatus: HEALTH_STATUS_OK,
            healthError: null,
            serverHealthError: null,
            advertisedModel: null,
          },
        ],
      },
    ]

    client.start({ initialRobots })
    client.removeRobot('opentrons-dev')

    expect(onListChange).toHaveBeenCalledTimes(1)
    expect(onListChange).toHaveBeenCalledWith([])
  })
})
