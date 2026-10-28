import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SimulateRequest } from '@/shared/api/types'
import { buildResult, ONE_STOP, TWO_STOPS } from './result-fixtures'
import { useSimulation } from './use-simulation'

const REQUEST: SimulateRequest = {
  raceId: 'italian-gp',
  driverId: 'leclerc',
  stints: [
    { compound: 'MEDIUM', laps: 30 },
    { compound: 'HARD', laps: 23 },
  ],
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSimulation', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useSimulation('italian-gp'), { wrapper: wrapper() })
    expect(result.current.view).toEqual({ kind: 'idle' })
  })

  it('posts the request and moves loading then success', async () => {
    let release: (response: Response) => void = () => undefined
    const fetchMock = vi.fn<typeof fetch>(
      () => new Promise<Response>((resolve) => (release = resolve)),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useSimulation('italian-gp'), { wrapper: wrapper() })

    act(() => result.current.run(REQUEST))
    await waitFor(() => expect(result.current.view.kind).toBe('loading'))
    expect(result.current.view).toMatchObject({ kind: 'loading', request: REQUEST })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('/api/simulate')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(REQUEST)

    const response = buildResult(TWO_STOPS)
    release(jsonResponse(200, response))
    await waitFor(() => expect(result.current.view.kind).toBe('success'))
    expect(result.current.view).toMatchObject({
      kind: 'success',
      current: response,
      previous: null,
    })
  })

  it('keeps the earlier result as the previous one', async () => {
    const first = buildResult(TWO_STOPS)
    const second = buildResult(ONE_STOP)
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse(200, first))
        .mockResolvedValueOnce(jsonResponse(200, second)),
    )
    const { result } = renderHook(() => useSimulation('italian-gp'), { wrapper: wrapper() })

    act(() => result.current.run(REQUEST))
    await waitFor(() => expect(result.current.view.kind).toBe('success'))
    act(() => result.current.run(REQUEST))
    await waitFor(() =>
      expect(result.current.view).toMatchObject({
        kind: 'success',
        current: second,
        previous: first,
      }),
    )
  })

  it('exposes the violations of a rejected strategy', async () => {
    const violation = {
      code: 'LAPS_MISMATCH',
      field: 'stints',
      params: { expected: 53, actual: 50 },
      message: 'Stints add up to 50 laps.',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        jsonResponse(400, {
          statusCode: 400,
          code: 'INVALID_STRATEGY',
          message: 'The strategy is not valid.',
          details: [violation],
        }),
      ),
    )
    const { result } = renderHook(() => useSimulation('italian-gp'), { wrapper: wrapper() })

    act(() => result.current.run(REQUEST))
    await waitFor(() => expect(result.current.view.kind).toBe('error'))
    const view = result.current.view
    if (view.kind !== 'error') throw new Error('expected error')
    expect(view.error.kind).toBe('invalid-strategy')
    expect(view.error.violations).toEqual([violation])
  })

  it('retries the last request after an error', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, buildResult(TWO_STOPS)))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useSimulation('italian-gp'), { wrapper: wrapper() })

    act(() => result.current.run(REQUEST))
    await waitFor(() => expect(result.current.view.kind).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.view.kind).toBe('success'))
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual(REQUEST)
  })

  it('drops the result and the previous one when the race changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => jsonResponse(200, buildResult(TWO_STOPS))),
    )
    const { result, rerender } = renderHook(({ raceId }) => useSimulation(raceId), {
      wrapper: wrapper(),
      initialProps: { raceId: 'italian-gp' as string | null },
    })

    act(() => result.current.run(REQUEST))
    await waitFor(() => expect(result.current.view.kind).toBe('success'))
    rerender({ raceId: 'monaco-gp' })
    expect(result.current.view).toEqual({ kind: 'idle' })
    rerender({ raceId: 'italian-gp' })
    expect(result.current.view).toEqual({ kind: 'idle' })
  })
})
