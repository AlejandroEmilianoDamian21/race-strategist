import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from './app-error'
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

const VALID_RESULT = {
  raceId: 'r1',
  driverId: 'd1',
  totalTime: 100.5,
  driverDelta: 0.2,
  stints: [
    {
      index: 0,
      compound: 'SOFT',
      startLap: 1,
      endLap: 2,
      laps: 2,
      time: 100.5,
      averageLapTime: 50.25,
      rainLoss: 0,
    },
  ],
  pitStops: [
    {
      lap: 1,
      fromCompound: 'SOFT',
      toCompound: 'HARD',
      pitLaneLoss: 19.5,
      tyreChangeTime: 2.5,
      totalLoss: 22,
    },
  ],
  laps: [
    {
      lap: 1,
      stintIndex: 0,
      compound: 'SOFT',
      tyreAge: 1,
      rainIntensity: 0,
      rainPenalty: 0,
      pitLoss: 0,
      time: 50.25,
    },
  ],
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
    const fetchMock = stubFetch(VALID_RESULT)
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
    const fetchMock = stubFetch({ ...VALID_RESULT, races: [], race: {} })
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

  it('simulate resolves with a well formed result', async () => {
    stubFetch(VALID_RESULT)
    const body = { raceId: 'r1', driverId: 'd1', stints: [{ compound: 'SOFT', laps: 10 }] }

    await expect(simulate(body)).resolves.toEqual(VALID_RESULT)
  })

  it.each([
    ['an unrelated object', { foo: 1 }],
    ['an array', []],
    ['null', null],
    ['a missing laps list', { ...VALID_RESULT, laps: undefined }],
    ['a non numeric total time', { ...VALID_RESULT, totalTime: '100' }],
    [
      'a stint without time',
      { ...VALID_RESULT, stints: [{ ...VALID_RESULT.stints[0], time: null }] },
    ],
    [
      'an unknown lap compound',
      { ...VALID_RESULT, laps: [{ ...VALID_RESULT.laps[0], compound: 'X' }] },
    ],
    ['a pit stop without a loss', { ...VALID_RESULT, pitStops: [{ lap: 1 }] }],
  ])('simulate rejects %s with an unknown AppError', async (_, payload) => {
    stubFetch(payload)
    const body = { raceId: 'r1', driverId: 'd1', stints: [{ compound: 'SOFT', laps: 10 }] }

    const error: unknown = await simulate(body).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      kind: 'unknown',
      method: 'POST',
      path: '/api/simulate',
      status: 200,
    })
  })
})
