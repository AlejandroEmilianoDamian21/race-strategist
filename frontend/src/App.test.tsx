import { QueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { MONACO, MONZA, OVERVIEW } from '@/features/races/race-fixtures'
import { formatTotalTime } from '@/features/result/format'
import { buildResult } from '@/features/result/result-fixtures'

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
      await screen.findByRole('heading', { name: 'La API no devolvió carreras' }),
    ).toBeVisible()
  })

  it('shows the loaded race count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [MONZA, MONACO] })),
    )
    render(<App client={createClient()} />)

    expect(await screen.findByText('Temporada 2026 · 2 carreras')).toBeVisible()
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

    expect(await screen.findByText('Temporada 2026 · 1 carrera')).toBeVisible()
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

  it('keeps the strategy builder gated by the race', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/overview')) return jsonResponse(200, OVERVIEW)
      return jsonResponse(200, { races: [MONZA, MONACO] })
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<App client={createClient()} />)
    const user = userEvent.setup()

    expect(await screen.findByRole('heading', { name: 'Primero elegí una carrera' })).toBeVisible()

    await user.click(await screen.findByRole('button', { name: /Italian Grand Prix/ }))

    expect((await screen.findAllByRole('button', { name: 'Simular' }))[0]).toBeDisabled()
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/overview')),
    ).toHaveLength(1)
  })

  it('keeps the driver grid and the builder selector in sync', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/overview')
          ? jsonResponse(200, OVERVIEW)
          : jsonResponse(200, { races: [MONZA, MONACO] }),
      ),
    )
    render(<App client={createClient()} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Italian Grand Prix/ }))
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Piloto' }), 'hamilton')

    expect(screen.getByRole('button', { name: /Lewis Hamilton/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: /Charles Leclerc/ }))
    expect(screen.getByRole('combobox', { name: 'Piloto' })).toHaveValue('leclerc')
  })

  describe('simulation', () => {
    const PLAN = [
      { compound: 'MEDIUM' as const, laps: 27, base: 82 },
      { compound: 'HARD' as const, laps: 26, base: 81 },
    ]

    function stubApi(simulate: () => Response | Promise<Response>) {
      const fetchMock = vi.fn<typeof fetch>(async (input) => {
        const url = String(input)
        if (url.endsWith('/overview')) return jsonResponse(200, OVERVIEW)
        if (url.endsWith('/api/simulate')) return simulate()
        return jsonResponse(200, { races: [MONZA, MONACO] })
      })
      vi.stubGlobal('fetch', fetchMock)
      return fetchMock
    }

    async function readyToSimulate() {
      render(<App client={createClient()} />)
      const user = userEvent.setup()
      await user.click(await screen.findByRole('button', { name: /Italian Grand Prix/ }))
      await user.click(await screen.findByRole('button', { name: /Charles Leclerc/ }))
      return user
    }

    it('shows the empty result with the ghost bar before simulating', async () => {
      stubApi(() => jsonResponse(200, buildResult(PLAN)))
      await readyToSimulate()

      expect(screen.getByRole('heading', { name: 'Todavía no simulaste' })).toBeVisible()
    })

    it('posts the strategy to the backend and shows the result it returns', async () => {
      const fetchMock = stubApi(() => jsonResponse(200, buildResult(PLAN)))
      const user = await readyToSimulate()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])

      expect(
        await screen.findByRole('heading', { level: 3, name: 'Paradas en boxes' }),
      ).toBeVisible()
      const call = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/api/simulate'))!
      expect(call[1]?.method).toBe('POST')
      expect(JSON.parse(String(call[1]?.body))).toEqual({
        raceId: 'italian-gp',
        driverId: 'leclerc',
        stints: [
          { compound: 'MEDIUM', laps: 27 },
          { compound: 'HARD', laps: 26 },
        ],
      })
      expect(screen.getAllByText(formatTotalTime(buildResult(PLAN).totalTime))).not.toHaveLength(0)
      expect(screen.getAllByRole('button', { name: 'Simular' })[0]).toBeEnabled()
    })

    it('shows the loading state while the backend answers', async () => {
      let release: (response: Response) => void = () => undefined
      stubApi(() => new Promise<Response>((resolve) => (release = resolve)))
      const user = await readyToSimulate()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])

      expect(await screen.findByText(/Simulando · vuelta \d+ de 53/)).toBeVisible()
      expect(screen.getByRole('button', { name: /Simulando vuelta \d+\/53/ })).toBeVisible()
      release(jsonResponse(200, buildResult(PLAN)))
      expect(await screen.findByRole('heading', { name: 'Paradas en boxes' })).toBeVisible()
    })

    it('offers the comparison from the second simulation and drops it on a new race', async () => {
      stubApi(() => jsonResponse(200, buildResult(PLAN)))
      const user = await readyToSimulate()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])
      await screen.findByRole('heading', { name: 'Paradas en boxes' })
      expect(
        screen.queryByRole('checkbox', { name: 'Comparar con la anterior' }),
      ).not.toBeInTheDocument()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])
      expect(
        await screen.findByRole('checkbox', { name: 'Comparar con la anterior' }),
      ).toBeChecked()

      await user.click(screen.getByRole('button', { name: /Monaco Grand Prix/ }))
      expect(await screen.findByRole('heading', { name: 'Todavía no simulaste' })).toBeVisible()
    })

    it('shows the rejected strategy and takes the user back to the offending stint', async () => {
      stubApi(() =>
        jsonResponse(400, {
          statusCode: 400,
          code: 'INVALID_STRATEGY',
          message: 'The strategy is not valid.',
          details: [
            {
              code: 'STINT_TOO_SHORT',
              field: 'stints[1].laps',
              params: { stint: 2, laps: 0 },
              message: 'Stint 2 has 0 laps.',
            },
          ],
        }),
      )
      Element.prototype.scrollIntoView = vi.fn()
      const user = await readyToSimulate()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])
      expect(
        await screen.findByRole('heading', { name: 'El backend rechazó la estrategia' }),
      ).toBeVisible()
      expect(screen.getByText('stints[1].laps')).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Volver a la estrategia' }))
      expect(screen.getByRole('spinbutton', { name: 'Vueltas del stint 2' })).toHaveFocus()
    })

    it('shows an api error with retry when the backend fails, and recovers', async () => {
      let attempts = 0
      stubApi(() =>
        ++attempts === 1
          ? jsonResponse(502, {
              statusCode: 502,
              code: 'UPSTREAM_UNAVAILABLE',
              message: 'The F1 data provider is unavailable right now. Please try again.',
            })
          : jsonResponse(200, buildResult(PLAN)),
      )
      const user = await readyToSimulate()

      await user.click(screen.getAllByRole('button', { name: 'Simular' })[0])
      expect(
        await screen.findByRole('heading', { name: 'No pudimos leer los datos de F1' }),
      ).toBeVisible()
      expect(screen.getByText(/POST \/api\/simulate → 502 · UPSTREAM_UNAVAILABLE/)).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('heading', { name: 'Paradas en boxes' })).toBeVisible()
    })
  })

  it('spaces the sections like the reference and offsets anchors under the header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [MONZA] })),
    )
    render(<App client={createClient()} />)
    await screen.findByText('Temporada 2026 · 1 carrera')

    const sections = Array.from(
      screen.getByRole('main').querySelectorAll<HTMLElement>('section[id^="step-"]'),
    )
    expect(sections.map((section) => section.id)).toEqual([
      'step-race',
      'step-info',
      'step-strategy',
      'step-result',
    ])
    sections.forEach((section) => {
      expect(section).toHaveClass('pt-12', 'first:pt-0', 'scroll-mt-[90px]')
    })
    expect(sections[0].parentElement).not.toHaveClass('gap-12')
  })

  it('closes the page with the data disclaimer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { races: [MONZA] })),
    )
    render(<App client={createClient()} />)

    expect(
      await screen.findByText(
        'Datos de la API del desafío (tech-challenge101.onrender.com). Los valores son inventados para el ejercicio y no representan el rendimiento real de pilotos ni equipos.',
      ),
    ).toHaveClass('mt-12')
  })
})
