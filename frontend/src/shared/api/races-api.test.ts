import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRaceOverview, getRaces, simulate } from './races-api'

function stubFetch(body: unknown) {
  const fetchMock = vi.fn(
    async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('races api', () => {
  it('getRaces unwraps the races list', async () => {
    const fetchMock = stubFetch({ races: [{ id: 'r1' }] })

    await expect(getRaces()).resolves.toEqual([{ id: 'r1' }])
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/races')
  })

  it('getRaceOverview encodes the id', async () => {
    const fetchMock = stubFetch({ race: { id: 'a/b' } })

    await getRaceOverview('a/b')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/races/a%2Fb/overview')
  })

  it('simulate posts the strategy', async () => {
    const fetchMock = stubFetch({ totalTime: 1 })
    const body = {
      raceId: 'r1',
      driverId: 'd1',
      stints: [{ compound: 'SOFT', laps: 10 }],
    }

    await simulate(body)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/simulate')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(body))
  })

  it('forwards the abort signal to fetch', async () => {
    const fetchMock = stubFetch({ races: [], race: {}, totalTime: 1 })
    const controller = new AbortController()
    const body = { raceId: 'r1', driverId: 'd1', stints: [{ compound: 'SOFT', laps: 10 }] }

    await getRaces(controller.signal)
    await getRaceOverview('r1', controller.signal)
    await simulate(body, controller.signal)

    const signals = fetchMock.mock.calls.map((call) => call[1]?.signal)
    expect(signals).toHaveLength(3)
    expect(signals.every((signal) => signal?.aborted === false)).toBe(true)
    controller.abort()
    expect(signals.every((signal) => signal?.aborted === true)).toBe(true)
  })
})
