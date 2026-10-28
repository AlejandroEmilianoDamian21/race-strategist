import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OVERVIEW } from './race-fixtures'
import { RaceInfoStep } from './race-info-step'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderStep(raceId: string | null, onSelectDriver = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RaceInfoStep raceId={raceId} driverId={null} onSelectDriver={onSelectDriver} />
    </QueryClientProvider>,
  )
  return onSelectDriver
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RaceInfoStep', () => {
  it('shows the empty text and fires no request without a selected race', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderStep(null)

    expect(
      screen.getByText('Elegí una carrera para ver el circuito, el clima y quién corre.'),
    ).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows skeleton cards while the overview loads', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    renderStep('italian-gp')

    expect(
      screen.getByRole('status', { name: 'Cargando información de la carrera…' }),
    ).toHaveAttribute('aria-busy', 'true')
  })

  it('renders the four cards once the overview arrives and forwards driver selection', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(200, OVERVIEW))
    vi.stubGlobal('fetch', fetchMock)
    const onSelectDriver = renderStep('italian-gp')

    expect(await screen.findByRole('heading', { name: 'Autodromo Nazionale Monza' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Neumáticos' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Clima por tramos' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Parrilla' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: /Charles Leclerc/ }))
    expect(onSelectDriver).toHaveBeenCalledWith('leclerc')
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/races/italian-gp/overview')
  })

  it('shows the api error panel and recovers on retry', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, OVERVIEW))
    vi.stubGlobal('fetch', fetchMock)
    renderStep('italian-gp')

    expect(
      await screen.findByRole('heading', { name: 'No pudimos leer los datos de F1' }),
    ).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Autodromo Nazionale Monza' })).toBeVisible()
  })
})
