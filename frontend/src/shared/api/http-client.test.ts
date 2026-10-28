import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from './app-error'
import { request } from './http-client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(impl: (...args: Parameters<typeof fetch>) => Promise<Response>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof AppError) return error
    throw error
  }
  throw new Error('expected the request to fail')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns parsed JSON on success', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { races: [] }))

    await expect(request('/api/races')).resolves.toEqual({ races: [] })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/races')
  })

  it('sends JSON bodies with POST and an abort signal', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { ok: true }))

    await request('/api/simulate', { method: 'POST', body: { raceId: 'r1' } })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ raceId: 'r1' }))
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('passes a combined signal to fetch that follows the external signal', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, { ok: true }))
    const controller = new AbortController()

    await request('/api/races', { signal: controller.signal })

    const passed = fetchMock.mock.calls[0]?.[1]?.signal
    expect(passed).toBeInstanceOf(AbortSignal)
    expect(passed?.aborted).toBe(false)
    controller.abort()
    expect(passed?.aborted).toBe(true)
  })

  it('does not report an external abort as a timeout', async () => {
    const controller = new AbortController()
    stubFetch(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }),
    )

    const pending = request('/api/races', { signal: controller.signal })
    controller.abort()

    const error = await pending.then(
      () => undefined,
      (caught: unknown) => caught,
    )
    expect(error).toBeDefined()
    expect(error instanceof AppError && error.kind === 'timeout').toBe(false)
    expect((error as DOMException).name).toBe('AbortError')
  })

  it('still maps a timeout to timeout when an external signal is given', async () => {
    const controller = new AbortController()
    stubFetch(async () => {
      throw new DOMException('signal timed out', 'TimeoutError')
    })

    const error = await failure(request('/api/races', { signal: controller.signal }))
    expect(error.kind).toBe('timeout')
  })

  it('times out for real when no external signal aborts', async () => {
    stubFetch(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }),
    )

    const error = await failure(
      request('/api/races', { timeoutMs: 10, signal: new AbortController().signal }),
    )
    expect(error.kind).toBe('timeout')
  })

  describe('when AbortSignal.any is not available', () => {
    const originalAny = AbortSignal.any

    beforeEach(() => {
      Reflect.deleteProperty(AbortSignal, 'any')
    })

    afterEach(() => {
      AbortSignal.any = originalAny
    })

    it('still follows the external signal', async () => {
      const fetchMock = stubFetch(async () => jsonResponse(200, { ok: true }))
      const controller = new AbortController()

      await request('/api/races', { signal: controller.signal })

      const passed = fetchMock.mock.calls[0]?.[1]?.signal
      expect(passed?.aborted).toBe(false)
      controller.abort()
      expect(passed?.aborted).toBe(true)
    })

    it('still times out with an external signal', async () => {
      stubFetch(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
          }),
      )

      const error = await failure(
        request('/api/races', { timeoutMs: 10, signal: new AbortController().signal }),
      )
      expect(error.kind).toBe('timeout')
    })
  })

  it('throws a network AppError when fetch rejects', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = await failure(request('/api/races'))
    expect(error.kind).toBe('network')
    expect(error).toMatchObject({ method: 'GET', path: '/api/races' })
  })

  it('throws a timeout AppError when the signal times out', async () => {
    stubFetch(async () => {
      throw new DOMException('signal timed out', 'TimeoutError')
    })

    const error = await failure(request('/api/races'))
    expect(error.kind).toBe('timeout')
    expect(error).toMatchObject({ method: 'GET', path: '/api/races' })
  })

  it('maps upstream failures keeping status, code and reason', async () => {
    stubFetch(async () =>
      jsonResponse(502, {
        statusCode: 502,
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'down',
        details: { reason: 'server-error', resource: '/api/races' },
      }),
    )

    const error = await failure(request('/api/races'))
    expect(error).toMatchObject({
      kind: 'upstream',
      status: 502,
      statusCode: 502,
      method: 'GET',
      path: '/api/races',
      backendMessage: 'down',
      code: 'UPSTREAM_UNAVAILABLE',
      details: { reason: 'server-error' },
    })
  })

  it('maps 404 to not-found', async () => {
    stubFetch(async () =>
      jsonResponse(404, {
        statusCode: 404,
        code: 'RACE_NOT_FOUND',
        message: 'nope',
      }),
    )

    const error = await failure(request('/api/races/x/overview'))
    expect(error.kind).toBe('not-found')
  })

  it('maps INVALID_STRATEGY with its violations', async () => {
    const violations = [{ code: 'NO_STINTS', field: 'stints', params: {}, message: 'm' }]
    stubFetch(async () =>
      jsonResponse(400, {
        statusCode: 400,
        code: 'INVALID_STRATEGY',
        message: 'bad',
        details: violations,
      }),
    )

    const error = await failure(request('/api/simulate', { method: 'POST', body: {} }))
    expect(error.kind).toBe('invalid-strategy')
    expect(error.violations).toEqual(violations)
  })

  it('maps VALIDATION_FAILED', async () => {
    stubFetch(async () =>
      jsonResponse(400, {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'bad',
        details: ['x'],
      }),
    )

    const error = await failure(request('/api/simulate', { method: 'POST', body: {} }))
    expect(error.kind).toBe('validation')
  })

  it('does not crash on a non-JSON error body', async () => {
    stubFetch(async () => new Response('<html>Bad gateway</html>', { status: 502 }))

    const error = await failure(request('/api/races'))
    expect(error.kind).toBe('unknown')
    expect(error.status).toBe(502)
    expect(error).toMatchObject({ method: 'GET', path: '/api/races' })
  })

  it('treats a non-JSON success body as unknown', async () => {
    stubFetch(async () => new Response('not json', { status: 200 }))

    const error = await failure(request('/api/simulate', { method: 'POST', body: {} }))
    expect(error.kind).toBe('unknown')
    expect(error).toMatchObject({ method: 'POST', path: '/api/simulate' })
  })
})
