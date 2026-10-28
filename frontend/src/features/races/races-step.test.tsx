import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MONACO, MONZA } from './race-fixtures'
import { RacesStep } from './races-step'

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
  const races = [MONZA, MONACO].slice(0, count)
  return new Response(JSON.stringify({ races }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderStep(selectedId: string | null = null, onSelect: (id: string) => void = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RacesStep selectedId={selectedId} onSelect={onSelect} />
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

describe('RacesStep retry behavior', () => {
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
    expect(screen.getByRole('status', { name: 'Cargando carreras…' })).toBeVisible()

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
    expect((signals[0]?.reason as Error | undefined)?.name).not.toBe('TimeoutError')
    expect(signals[1]?.aborted).toBe(false)
    expect(errorHeading()).toBeNull()
    expect(screen.getByRole('status', { name: 'Cargando carreras…' })).toBeVisible()

    await advance(3000)
    expect(wakeHeading()).toBeVisible()
    expect(errorHeading()).toBeNull()

    pending[1].resolve(racesResponse(1))
    await advance(0)
    expect(screen.getByText('1 carrera en el calendario')).toBeVisible()
  })
})

describe('RacesStep states', () => {
  it('shows the skeleton while the first request is pending', () => {
    renderStep()

    expect(screen.getByRole('status', { name: 'Cargando carreras…' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('renders the race cards and forwards the selection', async () => {
    const onSelect = vi.fn()
    renderStep('monaco-gp', onSelect)
    pending[0].resolve(racesResponse(2))
    await advance(0)

    expect(screen.getByText('2 carreras en el calendario')).toBeVisible()
    expect(screen.getByRole('button', { name: /Monaco Grand Prix/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: /Italian Grand Prix/ }))
    expect(onSelect).toHaveBeenCalledWith('italian-gp')
  })

  it('shows an empty message when the calendar has no races', async () => {
    renderStep()
    pending[0].resolve(racesResponse(0))
    await advance(0)

    expect(screen.getByRole('heading', { name: 'No hay carreras en el calendario' })).toBeVisible()
  })
})
