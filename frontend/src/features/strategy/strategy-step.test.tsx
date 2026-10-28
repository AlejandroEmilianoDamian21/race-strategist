import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import { StrategyStep } from './strategy-step'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface StepOptions {
  driverId?: string | null
  simulationProgress?: number | null
}

function renderStep(
  raceId: string | null,
  { driverId = null, simulationProgress }: StepOptions = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onSimulate = vi.fn()
  const onSelectDriver = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <StrategyStep
        raceId={raceId}
        driverId={driverId}
        onSelectDriver={onSelectDriver}
        onSimulate={onSimulate}
        simulationProgress={simulationProgress}
      />
    </QueryClientProvider>,
  )
  return { onSimulate, onSelectDriver }
}

function stubOverview() {
  const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(200, OVERVIEW))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function lapsInput(stint: number) {
  return screen.getByRole('spinbutton', { name: `Vueltas del stint ${stint}` })
}

function rows() {
  return within(
    screen
      .getAllByRole('list')
      .find((list) => list.tagName === 'UL' && list.querySelector('[role=radiogroup]')!)!,
  ).getAllByRole('listitem')
}

async function builderReady(driverId: string | null = 'leclerc') {
  stubOverview()
  const handlers = renderStep('italian-gp', { driverId })
  await screen.findByRole('button', { name: 'Simular' })
  return handlers
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StrategyStep states', () => {
  it('asks to pick a race first and fires no request', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderStep(null)

    expect(screen.getByRole('heading', { name: 'Armá tu estrategia' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Primero elegí una carrera' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a busy skeleton instead of the builder while the overview loads', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    renderStep('italian-gp')

    expect(
      screen.getByRole('status', { name: 'Esperando los datos de la carrera…' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument()
  })

  it('shows the API error with a retry, and no builder, when the overview fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(500, { statusCode: 500, code: 'RACE5001', message: 'Upstream down' }),
      )
      .mockResolvedValue(jsonResponse(200, OVERVIEW))
    vi.stubGlobal('fetch', fetchMock)
    renderStep('italian-gp')

    expect(
      await screen.findByRole('heading', { name: 'No pudimos leer los datos de F1' }),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Piloto' })).not.toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: /Reintentar/ }))

    expect(await screen.findByRole('button', { name: 'Simular' })).toBeVisible()
  })
})

describe('StrategyStep builder', () => {
  it('preloads the one-stop Medium to Hard strategy with its facts', async () => {
    await builderReady(null)

    expect(screen.getByRole('radio', { name: 'Medio', checked: true })).toBeVisible()
    expect(lapsInput(1)).toHaveValue(27)
    expect(lapsInput(2)).toHaveValue(26)
    expect(screen.getByText(/Parada 19\.5 \+ 2\.5 =/)).toHaveTextContent(
      'Parada 19.5 + 2.5 = 22.0s',
    )
    expect(screen.getByText(/Mínimo/)).toHaveTextContent('Mínimo 1 parada')
    expect(screen.getByText('Estrategia válida · 1 parada · cubre las 53 vueltas.')).toBeVisible()
  })

  it('syncs the driver selector with the selected driver and reports changes', async () => {
    const { onSelectDriver } = await builderReady('hamilton')

    const select = screen.getByRole('combobox', { name: 'Piloto' })
    expect(select).toHaveValue('hamilton')
    expect(screen.getByText('Ferrari · auto 0.95 · ritmo 0.96')).toBeVisible()

    await userEvent.setup().selectOptions(select, 'rookie')

    expect(onSelectDriver).toHaveBeenCalledWith('rookie')
  })

  it('disables SIMULAR with a reason until a driver is selected', async () => {
    await builderReady(null)

    expect(screen.getByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Elegí un piloto para simular')).toBeVisible()
  })

  it('emits the simulate request for the selected driver and strategy', async () => {
    const { onSimulate } = await builderReady()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Simular' }))

    expect(onSimulate).toHaveBeenCalledWith({
      raceId: 'italian-gp',
      driverId: 'leclerc',
      stints: [
        { compound: 'MEDIUM', laps: 27 },
        { compound: 'HARD', laps: 26 },
      ],
    })
  })

  it('breaking the sum shows the gap, the message, the reason and scopes the error to the last row', async () => {
    const { onSimulate } = await builderReady()

    fireEvent.change(lapsInput(2), { target: { value: '15' } })

    const bar = screen.getByRole('list', { name: 'Stints de la estrategia' })
    expect(within(bar).getByRole('listitem', { name: 'Faltan 11 vueltas' })).toHaveTextContent(
      'Faltan 11',
    )
    expect(document.querySelector('ul[aria-live="polite"]')).toHaveTextContent(
      'Los stints suman 42 vueltas y la carrera tiene 53. Faltan 11 vueltas por cubrir.',
    )
    expect(screen.getByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Corregí 1 error para simular')).toBeVisible()
    const [first, second] = rows()
    expect(first).not.toHaveAttribute('data-invalid')
    expect(second).toHaveAttribute('data-invalid', 'true')
    expect(
      within(bar)
        .getAllByRole('listitem')
        .filter((item) => item.hasAttribute('data-invalid')),
    ).toHaveLength(0)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simular' }))
    expect(onSimulate).not.toHaveBeenCalled()
  })

  it('scopes a too-short stint to its own segment and row, not to the others', async () => {
    await builderReady()
    fireEvent.change(lapsInput(2), { target: { value: '53' } })
    fireEvent.change(lapsInput(1), { target: { value: '' } })

    const bar = screen.getByRole('list', { name: 'Stints de la estrategia' })
    const segments = within(bar).getAllByRole('listitem')
    expect(segments[0]).toHaveAttribute('data-invalid', 'true')
    expect(segments[1]).not.toHaveAttribute('data-invalid')
    const [first, second] = rows()
    expect(first).toHaveAttribute('data-invalid', 'true')
    expect(second).not.toHaveAttribute('data-invalid')
    expect(lapsInput(1)).toHaveAttribute('aria-invalid', 'true')
    expect(lapsInput(2)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByText(/necesita al menos 1 vuelta/)).toHaveTextContent(
      'Stint 1 necesita al menos 1 vuelta.',
    )
  })

  it('asks for the minimum pit stops when the only other stint is removed', async () => {
    await builderReady()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar stint 2' }))

    expect(lapsInput(1)).toHaveValue(53)
    expect(screen.getByRole('button', { name: 'Quitar stint 1' })).toBeDisabled()
    expect(screen.getByText(/Esta carrera exige/)).toHaveTextContent('al menos 1 parada')
    expect(screen.getByText('Corregí 1 error para simular')).toBeVisible()
  })

  it('shows a non-blocking rain warning pointing at the ideal compound', async () => {
    await builderReady()

    await userEvent.setup().click(within(rows()[1]!).getByRole('radio', { name: 'Blando' }))

    const issues = document.querySelector('ul[aria-live="polite"]')
    expect(issues).toHaveTextContent(
      'Stint 2 · Blando corre V31–V53 con lluvia moderada (0.35). Rinde entre 0 y 0.05: perdés ≈5.4s por vuelta.',
    )
    expect(screen.getByRole('button', { name: 'Simular' })).toBeEnabled()
  })

  it('adds a stop by splitting the longest stint', async () => {
    await builderReady()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Agregar parada' }))

    expect(rows()).toHaveLength(3)
    expect(lapsInput(1)).toHaveValue(14)
    expect(lapsInput(2)).toHaveValue(13)
    expect(lapsInput(3)).toHaveValue(26)
  })

  it('moves a pit stop from the slider, the number field and the bar handle', async () => {
    await builderReady()

    fireEvent.change(screen.getByRole('slider', { name: 'Vuelta de parada 1' }), {
      target: { value: '30' },
    })
    expect(lapsInput(1)).toHaveValue(30)
    expect(lapsInput(2)).toHaveValue(23)

    fireEvent.keyDown(screen.getByRole('button', { name: 'Mover parada 1 (vuelta 30)' }), {
      key: 'ArrowLeft',
    })
    expect(lapsInput(1)).toHaveValue(29)
    expect(lapsInput(2)).toHaveValue(24)
  })

  it('never lets the handle cross its neighbour', async () => {
    await builderReady()
    const handle = screen.getByRole('button', { name: 'Mover parada 1 (vuelta 27)' })

    for (let press = 0; press < 40; press += 1) fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expect(lapsInput(1)).toHaveValue(52)
    expect(lapsInput(2)).toHaveValue(1)
  })

  it('shows the simulating state driven by the progress prop', async () => {
    stubOverview()
    renderStep('italian-gp', { driverId: 'leclerc', simulationProgress: 0.5 })

    const button = await screen.findByRole('button', { name: /Simulando vuelta 27\/53/ })

    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})
