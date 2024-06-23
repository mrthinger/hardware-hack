import nodeFetch from 'node-fetch'
import isError from 'lodash/isError'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'

import * as Fixtures from '../fixtures'
import { createHealthPoller } from '../health-poller'

import type { RequestInit, Response } from 'node-fetch'
import type { HealthPoller } from '../types'

// TODO(mc, 2020-07-13): remove __mocks__/node-fetch
vi.mock('node-fetch')

const EXPECTED_FETCH_OPTS = {
  timeout: 10000,
  headers: { 'Opentrons-Version': '2' },
}

const stubFetchOnce = (
  stubUrl: string,
  stubOptions: RequestInit = EXPECTED_FETCH_OPTS
) => (response: Partial<Response> | Error) => {
  vi.mocked(nodeFetch).mockImplementationOnce((url, options) => {
    expect(url).toBe(stubUrl)
    expect(options).toEqual(stubOptions)

    return isError(response)
      ? Promise.reject(response)
      : Promise.resolve(response as Response)
  })
}

const makeMockJsonResponse = (
  body: unknown,
  ok = true,
  status = 200
): Partial<Response> => {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) }
}

const HOST_1 = { ip: '127.0.0.1', port: 31950 }
const HOST_2 = { ip: '127.0.0.2', port: 31950 }
const HOST_3 = { ip: '127.0.0.3', port: 31950 }

const ISE_RESPONSE: Response = {
  ok: false,
  status: 500,
  text: () => Promise.resolve('AH'),
} as any

const flush = (): Promise<void> => new Promise(resolve => setImmediate(resolve))

describe('health poller', () => {
  const onPollResult = vi.fn()
  let poller: HealthPoller

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(nodeFetch).mockResolvedValue(ISE_RESPONSE)

    poller = createHealthPoller({ onPollResult })
  })

  afterEach(() => {
    return flush().then(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
      vi.resetAllMocks()
    })
  })

  it('should call GET /health and GET /server/update/health', () => {
    const expectedFetches = [
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    poller.start({ list: [HOST_1, HOST_2, HOST_3], interval: 1000 })
    vi.advanceTimersByTime(2000)
    expect(nodeFetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })

  it('should be able to stop polling', () => {
    poller.start({ list: [HOST_1, HOST_2, HOST_3], interval: 1000 })
    poller.stop()
    vi.advanceTimersByTime(2000)
    expect(nodeFetch).toHaveBeenCalledTimes(0)
  })

  it('should be able to restart with a new list', () => {
    poller.start({ list: [HOST_1, HOST_2], interval: 1000 })
    vi.advanceTimersByTime(1000)
    poller.start({ list: [HOST_1, HOST_3] })
    vi.advanceTimersByTime(1000)

    const expectedFetches = [
      // round 1: poll HOST_1 and HOST_2
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      // round 2: HOST_1 still in list, HOST_2 removed, HOST_3 added
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    expect(nodeFetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })

  it('should be able to restart with a new list and new polling interval', () => {
    const expectedFetches = [
      // round 1: poll HOST_1 and HOST_2
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      // round 2: HOST_1 still in list, HOST_2 removed, HOST_3 added
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
    ]

    // round 1
    poller.start({ list: [HOST_1, HOST_2], interval: 1000 })
    vi.advanceTimersByTime(1000)
    expect(nodeFetch).toHaveBeenCalledTimes(4)
    expectedFetches.slice(0, 4).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })

    // round 2
    vi.mocked(nodeFetch).mockClear()
    poller.start({ list: [HOST_1, HOST_3], interval: 4000 })
    // advance timer by old interval, ensure no fetches went out
    // 4000 should be high enough to avoid any requests going out from the
    // poller spreading requests out over the interval
    vi.advanceTimersByTime(1000)
    expect(nodeFetch).toHaveBeenCalledTimes(0)
    // then advance timer enough to hit 4000 total time elapsed
    vi.advanceTimersByTime(3000)
    expect(nodeFetch).toHaveBeenCalledTimes(4)
    expectedFetches.slice(4, 8).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })

  it('should not lose queue order on restart with same list contents', () => {
    poller.start({ list: [HOST_1, HOST_2], interval: 1000 })
    vi.advanceTimersByTime(500)
    poller.start({ list: [HOST_1, HOST_2] })
    vi.advanceTimersByTime(500)

    const expectedFetches = [
      // round 1: poll HOST_1
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      // round 2: poll HOST_2 after list "refreshed"
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
    ]

    expect(nodeFetch).toHaveBeenCalledTimes(expectedFetches.length)
    expectedFetches.forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })

  it('should map successful fetch responses to onPollResult', () => {
    stubFetchOnce('http://127.0.0.1:31950/health')(
      makeMockJsonResponse(Fixtures.mockLegacyHealthResponse)
    )
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      makeMockJsonResponse(Fixtures.mockLegacyServerHealthResponse)
    )

    poller.start({ list: [HOST_1], interval: 1000 })

    vi.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: Fixtures.mockLegacyHealthResponse,
        serverHealth: Fixtures.mockLegacyServerHealthResponse,
        healthError: null,
        serverHealthError: null,
      })
    })
  })

  it('should map partially successful fetch responses to onPollResult', () => {
    stubFetchOnce('http://127.0.0.1:31950/health')(
      makeMockJsonResponse({ message: 'some error' }, false, 400)
    )
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      makeMockJsonResponse(Fixtures.mockOT3ServerHealthResponse)
    )

    poller.start({ list: [HOST_1], interval: 1000 })
    vi.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: Fixtures.mockOT3ServerHealthResponse,
        healthError: { status: 400, body: { message: 'some error' } },
        serverHealthError: null,
      })
    })
  })

  it('should map routable but failed responses to onPollResult', () => {
    stubFetchOnce('http://127.0.0.1:31950/health')({
      ok: false,
      status: 504,
      text: () => Promise.resolve('Gateway timeout'),
    })
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')({
      ok: false,
      status: 504,
      text: () => Promise.resolve('Gateway timeout'),
    })

    poller.start({ list: [HOST_1], interval: 1000 })
    vi.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: null,
        healthError: { status: 504, body: 'Gateway timeout' },
        serverHealthError: { status: 504, body: 'Gateway timeout' },
      })
    })
  })

  it('should map fetch errors to onPollResult', () => {
    stubFetchOnce('http://127.0.0.1:31950/health')(new Error('Failed to fetch'))
    stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
      new Error('Failed to fetch')
    )

    poller.start({ list: [HOST_1], interval: 1000 })
    vi.advanceTimersByTime(1000)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledWith({
        ip: '127.0.0.1',
        port: 31950,
        health: null,
        serverHealth: null,
        healthError: { status: -1, body: 'Failed to fetch' },
        serverHealthError: { status: -1, body: 'Failed to fetch' },
      })
    })
  })

  it('should spread its fetches out over the interval', () => {
    const expectedFetches = [
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
      'http://127.0.0.2:31950/health',
      'http://127.0.0.2:31950/server/update/health',
      'http://127.0.0.3:31950/health',
      'http://127.0.0.3:31950/server/update/health',
      'http://127.0.0.1:31950/health',
      'http://127.0.0.1:31950/server/update/health',
    ]

    poller.start({ list: [HOST_1, HOST_2, HOST_3], interval: 300 })
    vi.advanceTimersByTime(100)
    expect(nodeFetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(0, 2).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })

    vi.mocked(nodeFetch).mockClear()
    vi.advanceTimersByTime(100)
    expect(nodeFetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(2, 4).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })

    vi.mocked(nodeFetch).mockClear()
    vi.advanceTimersByTime(100)
    expect(nodeFetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(4, 6).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })

    vi.mocked(nodeFetch).mockClear()
    vi.advanceTimersByTime(100)
    expect(nodeFetch).toHaveBeenCalledTimes(2)
    expectedFetches.slice(6, 8).forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })

  // TODO(mc, 2020-07-13): Jest v25 fake timers do not mock Date.now, and using
  // real times makes this test flakey. Revisit after upgrade to Jest v26
  it.todo('should ignore late responses')
  // // the first two calls the fetch (/health and /server/update/health) will error
  // // out _after_ the second two calls are made and completed
  // const mockErrorImpl = () => {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => reject(new Error('Oh no eventual error!')), 75)
  //   })
  // }
  // fetch.mockImplementationOnce(mockErrorImpl)
  // fetch.mockImplementationOnce(mockErrorImpl)

  // // the second two calls with successfully resolve quickly before the first
  // // two calls return their eventual errors
  // stubFetchOnce('http://127.0.0.1:31950/health')(
  //   makeMockJsonResponse(Fixtures.mockHealthResponse)
  // )
  // stubFetchOnce('http://127.0.0.1:31950/server/update/health')(
  //   makeMockJsonResponse(Fixtures.mockServerHealthResponse)
  // )

  // poller.start({
  //   list: [HOST_1],
  //   // NOTE(mc, 2020-07-13): see TODO above. This value chosen to work well
  //   // with real time but runs the risk of being flakey because setTimeout
  //   // is not exact in real life
  //   interval: 50,
  // })

  // return new Promise(resolve => setTimeout(resolve, 150)).then(() => {
  //   // ensure that the fact that the second poll returned means the eventual
  //   // errors for the first poll are thrown away
  //   expect(onPollResult).toHaveBeenCalledTimes(1)
  //   expect(onPollResult).toHaveBeenCalledWith({
  //     ip: '127.0.0.1',
  //     port: 31950,
  //     health: Fixtures.mockHealthResponse,
  //     serverHealth: Fixtures.mockServerHealthResponse,
  //     healthError: null,
  //     serverHealthError: null,
  //   })
  // })

  it('should ignore responses after stop()', () => {
    const mockErrorImpl = (): Promise<Response> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Oh no eventual error!')), 25)
      })
    }

    vi.mocked(nodeFetch).mockImplementationOnce(mockErrorImpl)
    vi.mocked(nodeFetch).mockImplementationOnce(mockErrorImpl)

    poller.start({ list: [HOST_1], interval: 50 })
    vi.advanceTimersByTime(50)
    poller.stop()
    vi.advanceTimersByTime(50)

    return flush().then(() => {
      expect(onPollResult).toHaveBeenCalledTimes(0)
    })
  })

  it('should work with IPv6 addresses', () => {
    const expectedFetches = [
      'http://[fd00:0:cafe:fefe::1]:31950/health',
      'http://[fd00:0:cafe:fefe::1]:31950/server/update/health',
    ]

    poller.start({
      list: [{ ip: 'fd00:0:cafe:fefe::1', port: 31950 }],
      interval: 1000,
    })

    vi.advanceTimersByTime(1000)
    expectedFetches.forEach((url, idx) => {
      expect(nodeFetch).toHaveBeenNthCalledWith(
        idx + 1,
        url,
        EXPECTED_FETCH_OPTS
      )
    })
  })
})
