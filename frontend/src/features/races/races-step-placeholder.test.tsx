import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RacesStepPlaceholder } from './races-step-placeholder'

interface Deferred {
  resolve: (response: Response) => void
  reject: (error: unknown) => void
  promise: Promise<Response>
}

function deferred(): Deferred {
  let resolve!: Deferred['resolve']
  let reject!: Deferred['reject']
  const promise = new Promise<Response>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { resolve, reject, promise }
}

function racesResponse(count: number): Response {
  const races = Array.from({ length: count }, (_, index) => ({ id: `race-${index}` }))
  return new Response(JSON.stringify({ races }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderStep() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RacesStepPlaceholder />
    </QueryClientProvider>,
  )
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const errorHeading = () =>
  screen.queryByRole('heading', { name: 'No pudimos leer los datos de F1' })
const wakeHeading = () => screen.queryByRole('heading', { name: 'Despertando el servidor' })
const retryButton = () => screen.getByRole('button', { name: 'Reintentar' })

let pending: Deferred[]
let signals: (AbortSignal | undefined)[]

beforeEach(() => {
  vi.useFakeTimers()
  pending = []
  signals = []
  vi.stubGlobal(
    'fetch',
    vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const next = deferred()
      pending.push(next)
      signals.push(init?.signal ?? undefined)
      init?.signal?.addEventListener('abort', () =>
        next.reject(new DOMException('aborted', 'AbortError')),
      )
      return next.promise
    }),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('RacesStepPlaceholder retry behavior', () => {
  it('leaves the error state on retry, shows waking after 3s and then the data', async () => {
    renderStep()
    pending[0].reject(new TypeError('Failed to fetch'))
    await advance(0)
    expect(errorHeading()).toBeVisible()

    expect(pending).toHaveLength(1)

    fireEvent.click(retryButton())
    await advance(0)

    expect(pending).toHaveLength(2)
    expect(errorHeading()).toBeNull()
    expect(screen.getByText('Cargando carreras…')).toBeVisible()

    await advance(3000)
    expect(wakeHeading()).toBeVisible()

    pending[1].resolve(racesResponse(2))
    await advance(0)
    expect(screen.getByText('2 carreras en el calendario')).toBeVisible()
  })

  it('shows the timed-out panel after 90s and restarts the timer on retry', async () => {
    renderStep()
    await advance(3000)
    expect(wakeHeading()).toBeVisible()

    await advance(87000)
    expect(wakeHeading()).toBeNull()
    expect(errorHeading()).toBeVisible()

    expect(pending).toHaveLength(1)

    fireEvent.click(retryButton())
    await advance(0)

    expect(pending).toHaveLength(2)
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    expect(errorHeading()).toBeNull()
    expect(screen.getByText('Cargando carreras…')).toBeVisible()

    await advance(3000)
    expect(wakeHeading()).toBeVisible()
    expect(errorHeading()).toBeNull()

    pending[1].resolve(racesResponse(1))
    await advance(0)
    expect(screen.getByText('1 carrera en el calendario')).toBeVisible()
  })
})
