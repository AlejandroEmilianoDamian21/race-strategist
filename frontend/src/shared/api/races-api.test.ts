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
})
