import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
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

function renderStep(raceId: string | null, driverId: string | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onSimulate = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <StrategyStep raceId={raceId} driverId={driverId} onSimulate={onSimulate} />
    </QueryClientProvider>,
  )
  return onSimulate
}

function stubOverview() {
  const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(200, OVERVIEW))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function lapsInput(stint: number) {
  return screen.getByRole('spinbutton', { name: `Vueltas del stint ${stint}` })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StrategyStep', () => {
  it('asks to pick a race first and fires no request', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderStep(null)

    expect(screen.getByRole('heading', { name: 'Armá tu estrategia' })).toBeVisible()
    expect(screen.getByText('Elegí una carrera para armar tu estrategia.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('waits for the overview without rendering the builder', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    renderStep('italian-gp')

    expect(screen.getByText('Esperando los datos de la carrera…')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument()
  })

  it('preloads the one-stop Medium to Hard strategy with its chips', async () => {
    stubOverview()
    renderStep('italian-gp')

    expect(await screen.findByRole('combobox', { name: 'Compuesto del stint 1' })).toHaveValue(
      'MEDIUM',
    )
    expect(screen.getByRole('combobox', { name: 'Compuesto del stint 2' })).toHaveValue('HARD')
    expect(lapsInput(1)).toHaveValue(23)
    expect(lapsInput(2)).toHaveValue(30)
    expect(screen.getByText('Vueltas 53 / 53')).toBeVisible()
    expect(screen.getByText('Parada 19.5 + 2.5')).toBeVisible()
    expect(screen.getByText('Mínimo 1 parada')).toBeVisible()
    expect(screen.getByText('Elegí un piloto')).toBeVisible()
    expect(screen.queryByRole('list', { name: 'Errores' })).not.toBeInTheDocument()
  })

  it('disables simulate until a driver is selected', async () => {
    stubOverview()
    renderStep('italian-gp')

    expect(await screen.findByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Elegí un piloto para simular')).toBeVisible()
  })

  it('shows the selected driver and emits the simulate request', async () => {
    stubOverview()
    const onSimulate = renderStep('italian-gp', 'leclerc')
    const button = await screen.findByRole('button', { name: 'Simular' })

    expect(screen.getByText('Charles Leclerc · Ferrari')).toBeVisible()
    expect(screen.getByText('Auto 0.95 · Ritmo 0.97')).toBeVisible()
    expect(button).toBeEnabled()
    await userEvent.setup().click(button)

    expect(onSimulate).toHaveBeenCalledWith({
      raceId: 'italian-gp',
      driverId: 'leclerc',
      stints: [
        { compound: 'MEDIUM', laps: 23 },
        { compound: 'HARD', laps: 30 },
      ],
    })
  })

  it('validates live: errors under the bar, inline on the row and on the button', async () => {
    stubOverview()
    const onSimulate = renderStep('italian-gp', 'leclerc')
    await screen.findByRole('button', { name: 'Simular' })

    fireEvent.change(lapsInput(2), { target: { value: '27' } })

    const message = 'Los stints suman 50 vueltas y la carrera tiene 53. Faltan 3 vueltas.'
    expect(screen.getByRole('list', { name: 'Errores' })).toHaveTextContent(message)
    expect(screen.getByText('Vueltas 50 / 53')).toHaveAttribute('data-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Corregí 1 error para simular')).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simular' }))
    expect(onSimulate).not.toHaveBeenCalled()
  })

  it('shows the stint error inline and marks the row invalid when laps are emptied', async () => {
    stubOverview()
    renderStep('italian-gp', 'leclerc')
    await screen.findByRole('button', { name: 'Simular' })

    fireEvent.change(lapsInput(1), { target: { value: '' } })

    expect(lapsInput(1)).toHaveAttribute('aria-invalid', 'true')
    expect(lapsInput(1)).toHaveAccessibleDescription(
      'El stint 1 tiene 0 vueltas. Cada stint necesita al menos 1 vuelta entera.',
    )
    expect(screen.getByText('Corregí 2 errores para simular')).toBeVisible()
    expect(screen.getAllByRole('listitem').some((item) => item.hasAttribute('data-invalid'))).toBe(
      true,
    )
  })

  it('shows a non-blocking rain warning', async () => {
    stubOverview()
    renderStep('italian-gp', 'leclerc')
    await screen.findByRole('button', { name: 'Simular' })

    await userEvent
      .setup()
      .selectOptions(screen.getByRole('combobox', { name: 'Compuesto del stint 2' }), 'SOFT')

    expect(screen.getByRole('list', { name: 'Avisos' })).toHaveTextContent(
      'Stint 2 · Blando corre V31–V53',
    )
    expect(screen.getByRole('button', { name: 'Simular' })).toBeEnabled()
  })

  it('adds a stint and removes it again', async () => {
    stubOverview()
    renderStep('italian-gp', 'leclerc')
    await screen.findByRole('button', { name: 'Simular' })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Agregar stint' }))
    expect(lapsInput(3)).toHaveValue(15)
    expect(lapsInput(2)).toHaveValue(15)
    expect(screen.getByText('Mínimo 1 parada')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Quitar el stint 3' }))
    expect(
      screen.queryByRole('spinbutton', { name: 'Vueltas del stint 3' }),
    ).not.toBeInTheDocument()
  })

  it('does not allow removing the only stint', async () => {
    stubOverview()
    renderStep('italian-gp', 'leclerc')
    await screen.findByRole('button', { name: 'Simular' })

    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar el stint 2' }))

    expect(screen.getByRole('button', { name: 'Quitar el stint 1' })).toBeDisabled()
    expect(screen.getByText('Mínimo 1 parada')).toBeVisible()
    expect(screen.getByText('Corregí 2 errores para simular')).toBeVisible()
  })
})
