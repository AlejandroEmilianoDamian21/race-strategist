import { QueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { MONACO, MONZA, OVERVIEW } from '@/features/races/race-fixtures'

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the shell with the title and the stepper', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [] })),
    )
    render(<App client={createClient()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Race Strategist' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Pasos' })).toBeVisible()
    expect(
      await screen.findByRole('heading', { name: 'No hay carreras en el calendario' }),
    ).toBeVisible()
  })

  it('shows the loaded race count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [MONZA, MONACO] })),
    )
    render(<App client={createClient()} />)

    expect(await screen.findByText('2 carreras en el calendario')).toBeVisible()
  })

  it('shows the api error and recovers on retry', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, { races: [MONZA] }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App client={createClient()} />)

    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos leer los datos de F1',
      }),
    ).toBeVisible()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('1 carrera en el calendario')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('switches the whole UI to English', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [] })),
    )
    render(<App client={createClient()} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'EN' }))

    expect(await screen.findByRole('navigation', { name: 'Steps' })).toBeVisible()
  })

  it('selects a race, loads its overview, advances the stepper and resets the driver on change', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/overview')) return jsonResponse(200, OVERVIEW)
      return jsonResponse(200, { races: [MONZA, MONACO] })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App client={createClient()} />)
    const user = userEvent.setup()

    expect(
      await screen.findByText('Elegí una carrera para ver el circuito, el clima y quién corre.'),
    ).toBeVisible()
    expect(screen.getByRole('progressbar', { name: 'Paso 1 de 5 · Carrera' })).toBeVisible()

    await user.click(await screen.findByRole('button', { name: /Italian Grand Prix/ }))
    await user.click(await screen.findByRole('button', { name: /Charles Leclerc/ }))

    expect(screen.getByRole('progressbar', { name: 'Paso 2 de 5 · Info' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Charles Leclerc/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /Monaco Grand Prix/ }))

    expect(await screen.findByRole('button', { name: /Charles Leclerc/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toContainEqual(
      expect.stringContaining('/api/races/monaco-gp/overview'),
    )
  })
})
