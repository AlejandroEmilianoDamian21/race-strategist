import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import { AppError } from '@/shared/api/app-error'
import type { SimulationResult } from '@/shared/api/types'
import { buildResult, ONE_STOP, TWO_STOPS } from './result-fixtures'
import { ResultStep } from './result-step'
import type { SimulationView } from './use-simulation'

const STINTS = [
  { compound: 'MEDIUM', laps: 30 },
  { compound: 'HARD', laps: 23 },
]

function renderStep(
  view: SimulationView,
  extra: Partial<React.ComponentProps<typeof ResultStep>> = {},
) {
  const handlers = { onRetry: vi.fn(), onBackToStrategy: vi.fn(), onBackToCalendar: vi.fn() }
  const utils = render(
    <ResultStep
      view={view}
      overview={OVERVIEW}
      builderStints={STINTS}
      lap={null}
      {...handlers}
      {...extra}
    />,
  )
  return { ...utils, ...handlers }
}

function success(previous: SimulationResult | null = null): SimulationView {
  return { kind: 'success', current: buildResult(TWO_STOPS), previous }
}

describe('ResultStep', () => {
  it('is the step 5 section with its heading', () => {
    const { container } = renderStep({ kind: 'idle' })

    expect(container.querySelector('section#step-result')).not.toBeNull()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Resultado de la simulación' }),
    ).toBeVisible()
  })

  it('shows the empty state with a ghost bar of the current strategy', () => {
    renderStep({ kind: 'idle' })

    expect(screen.getByRole('heading', { name: 'Todavía no simulaste' })).toBeVisible()
    const ghost = screen.getByRole('list', { name: 'Stints de la estrategia' })
    expect(within(ghost).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('shows the empty state without a bar when the race is not loaded', () => {
    renderStep({ kind: 'idle' }, { overview: undefined })

    expect(screen.getByRole('heading', { name: 'Todavía no simulaste' })).toBeVisible()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows the loading skeleton with the requested bar already drawn', () => {
    renderStep(
      { kind: 'loading', request: { raceId: 'italian-gp', driverId: 'leclerc', stints: STINTS } },
      { lap: 12 },
    )

    expect(screen.getByText('Simulando · vuelta 12 de 53')).toBeVisible()
    expect(screen.getByText('23%')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12')
    const bar = screen.getByRole('list', { name: 'Stints de la estrategia' })
    expect(within(bar).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: 'Paradas en boxes' })).not.toBeInTheDocument()
  })

  it('shows the invalid panel with each violation and goes back to the stint', async () => {
    const error = new AppError('invalid-strategy', {
      method: 'POST',
      path: '/api/simulate',
      status: 400,
      code: 'INVALID_STRATEGY',
      backendMessage: 'The strategy is not valid.',
      violations: [
        {
          code: 'STINT_TOO_SHORT',
          field: 'stints[1].laps',
          params: { stint: 2, laps: 0 },
          message: 'Stint 2 has 0 laps.',
        },
        {
          code: 'LAPS_MISMATCH',
          field: 'stints',
          params: { expected: 53, actual: 30 },
          message: 'Stints add up to 30.',
        },
      ],
    })
    const { onBackToStrategy } = renderStep({
      kind: 'error',
      error,
      request: { raceId: 'italian-gp', driverId: 'leclerc', stints: STINTS },
    })

    expect(screen.getByRole('heading', { name: 'El backend rechazó la estrategia' })).toBeVisible()
    expect(screen.getByText('stints[1].laps')).toBeVisible()
    expect(screen.getByText(/El stint 2 tiene 0 vueltas/)).toBeVisible()
    expect(
      screen.getByText('POST /api/simulate → 400 · INVALID_STRATEGY · The strategy is not valid.'),
    ).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Volver a la estrategia' }))
    expect(onBackToStrategy).toHaveBeenCalledWith('stints[1].laps')
  })

  it('shows the api error with retry for any other failure', async () => {
    const error = new AppError('upstream', {
      method: 'POST',
      path: '/api/simulate',
      status: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      backendMessage: 'The F1 data provider is unavailable right now. Please try again.',
    })
    const { onRetry } = renderStep({
      kind: 'error',
      error,
      request: { raceId: 'italian-gp', driverId: 'leclerc', stints: STINTS },
    })

    expect(screen.getByRole('heading', { name: 'No pudimos leer los datos de F1' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows a validation message without retry and goes back to the strategy', async () => {
    const error = new AppError('validation', {
      method: 'POST',
      path: '/api/simulate',
      status: 400,
      code: 'VALIDATION_FAILED',
      backendMessage: 'The request is not valid.',
      details: ['stints.0.laps must be a number'],
    })
    const { onRetry, onBackToStrategy } = renderStep({
      kind: 'error',
      error,
      request: { raceId: 'italian-gp', driverId: 'leclerc', stints: STINTS },
    })

    expect(screen.getByRole('heading', { name: 'El backend no aceptó la solicitud' })).toBeVisible()
    expect(screen.queryByText(/error interno/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(
      screen.getByText('POST /api/simulate → 400 · VALIDATION_FAILED · The request is not valid.'),
    ).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Volver a la estrategia' }))
    expect(onBackToStrategy).toHaveBeenCalledOnce()
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('lays out summary, pit stops, timeline, table and chart in reading order', () => {
    renderStep(success())

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual([
      'Paradas en boxes',
      'Línea de tiempo de stints',
      'Desglose por stint',
      'Tiempo por vuelta',
    ])
    expect(screen.getByText('Resumen')).toBeVisible()
    expect(screen.getAllByText('0:14:00.700')).toHaveLength(2)
  })

  it('offers no comparison on the first simulation', () => {
    renderStep(success())

    expect(
      screen.queryByRole('checkbox', { name: 'Comparar con la anterior' }),
    ).not.toBeInTheDocument()
  })

  it('adds only the delta, the dashed line and the ghost bar when comparing, and removes them when off', async () => {
    const previous = buildResult(ONE_STOP)
    const { container } = renderStep(success(previous))
    const toggle = screen.getByRole('checkbox', { name: 'Comparar con la anterior' })

    expect(toggle).toBeChecked()
    expect(screen.getByText(/vs\. anterior/)).toBeVisible()
    expect(container.querySelector('path[data-series="previous"]')).not.toBeNull()
    expect(screen.getByRole('list', { name: 'Estrategia anterior' })).toBeVisible()
    expect(screen.getByText(/Abajo, fina: la anterior \(Duro → Blando\)/)).toBeVisible()

    await userEvent.setup().click(toggle)

    expect(toggle).not.toBeChecked()
    expect(screen.queryByText(/vs\. anterior/)).not.toBeInTheDocument()
    expect(container.querySelector('path[data-series="previous"]')).toBeNull()
    expect(screen.queryByRole('list', { name: 'Estrategia anterior' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
  })
})
