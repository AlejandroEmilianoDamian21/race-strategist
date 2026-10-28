import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '@/shared/api/app-error'
import type { StrategyViolation } from '@/shared/api/types'
import { StatusPanel } from './status-panel'

describe('StatusPanel', () => {
  it('wake shows the reference copy, progress, elapsed time and steps', () => {
    render(<StatusPanel variant="wake" elapsedSeconds={23} />)

    expect(screen.getByRole('status')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Despertando el servidor' })).toBeVisible()
    expect(
      screen.getByText(/La API gratuita se duerme cuando no se usa\. La primera vez puede tardar/),
    ).toHaveTextContent(
      'La API gratuita se duerme cuando no se usa. La primera vez puede tardar hasta un minuto; después es rápida. No hace falta recargar.',
    )
    expect(screen.getByText('hasta un minuto').tagName).toBe('B')
    expect(screen.getByText('0:23 transcurridos')).toBeVisible()
    expect(screen.getByText('~1:00')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '23')
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement
    expect(parseFloat(fill.style.width)).toBeCloseTo(38.33, 1)
    expect(screen.getByText('Despertando la API · GET /api/__health/liveness')).toHaveClass(
      'text-ink',
    )
    expect(screen.getByText('Cargando carreras · GET /api/races')).toHaveClass('text-ink-faint')
    expect(screen.getByText('Cargando circuitos y neumáticos')).toHaveClass('text-ink-faint')
  })

  it('wake advances the steps after 30s and caps the bar at 95%', () => {
    render(<StatusPanel variant="wake" elapsedSeconds={58} />)

    expect(screen.getByText('Despertando la API · GET /api/__health/liveness')).toHaveClass(
      'text-ink-muted',
    )
    expect(screen.getByText('Cargando carreras · GET /api/races')).toHaveClass('text-ink')
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '95%' })
  })

  it('api-error describes the failure and retries', async () => {
    const onRetry = vi.fn()
    render(<StatusPanel variant="api-error" error={new AppError('network')} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'No pudimos leer los datos de F1' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveClass('bg-accent')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('api-error explains the upstream reason and shows the technical line', () => {
    render(
      <StatusPanel
        variant="api-error"
        error={
          new AppError('upstream', {
            method: 'GET',
            path: '/api/races',
            status: 502,
            backendMessage: 'Upstream is down',
            code: 'UPSTREAM_UNAVAILABLE',
            details: { reason: 'timeout', resource: '/api/races' },
          })
        }
        onRetry={() => {}}
      />,
    )

    expect(screen.getByText(/tardó demasiado en responder/)).toBeVisible()
    expect(
      screen.getByText('GET /api/races → 502 · UPSTREAM_UNAVAILABLE · Upstream is down'),
    ).toBeVisible()
  })

  it('api-error for a 500 uses the reference body and the mono technical line', () => {
    render(
      <StatusPanel
        variant="api-error"
        error={
          new AppError('unknown', {
            method: 'GET',
            path: '/api/races',
            status: 500,
            code: 'RACE5001',
            backendMessage: 'Internal error reading races',
          })
        }
        onRetry={() => {}}
      />,
    )

    expect(
      screen.getByText(
        'La API respondió con un error interno, o no respondió en 90 segundos. Tu estrategia no se pierde.',
      ),
    ).toBeVisible()
    const line = screen.getByText('GET /api/races → 500 · RACE5001 · Internal error reading races')
    expect(line).toHaveClass('font-mono', 'text-ink-faint')
  })

  it('api-error for a timeout uses the same reference body', () => {
    render(
      <StatusPanel
        variant="api-error"
        error={new AppError('timeout', { method: 'GET', path: '/api/races' })}
        onRetry={() => {}}
      />,
    )

    expect(
      screen.getByText(
        'La API respondió con un error interno, o no respondió en 90 segundos. Tu estrategia no se pierde.',
      ),
    ).toBeVisible()
    expect(screen.getByText('GET /api/races → timeout')).toBeVisible()
  })

  it('api-error for not-found offers to go back to the calendar instead of retrying', async () => {
    const onRetry = vi.fn()
    const onBack = vi.fn()
    render(
      <StatusPanel
        variant="api-error"
        error={
          new AppError('not-found', {
            method: 'GET',
            path: '/api/races/race-999',
            status: 404,
            code: 'RACE4040',
            backendMessage: 'Race not found',
          })
        }
        onRetry={onRetry}
        onBack={onBack}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No encontramos esa carrera' })).toBeVisible()
    expect(
      screen.getByText(
        'La carrera que pediste ya no existe en la API. Elegí otra del calendario. Tu estrategia no se pierde.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText('GET /api/races/race-999 → 404 · RACE4040 · Race not found'),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Volver al calendario' }))
    expect(onBack).toHaveBeenCalledOnce()
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('api-empty shows the empty-list title, body, technical line and retries', async () => {
    const onRetry = vi.fn()
    render(
      <StatusPanel
        variant="api-empty"
        technical="GET /api/races → 200 · data.races = [] (0 elementos)"
        onRetry={onRetry}
      />,
    )

    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'La API no devolvió carreras' })).toBeVisible()
    expect(
      screen.getByText(
        'La lista de carreras llegó vacía. Puede ser un problema temporal del proveedor. Tu estrategia no se pierde.',
      ),
    ).toBeVisible()
    expect(screen.getByText('GET /api/races → 200 · data.races = [] (0 elementos)')).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('empty-race shows its title', () => {
    render(<StatusPanel variant="empty-race" />)

    expect(screen.getByRole('heading', { name: 'Elegí una carrera' })).toBeVisible()
  })

  it('empty-strategy asks to pick a race first and explains what the builder needs', () => {
    render(<StatusPanel variant="empty-strategy" />)

    expect(screen.getByRole('heading', { name: 'Primero elegí una carrera' })).toBeVisible()
    expect(
      screen.getByText(
        'El constructor necesita las vueltas, el clima y los parámetros de esa carrera.',
      ),
    ).toBeVisible()
  })

  it('empty-result shows its title', () => {
    render(<StatusPanel variant="empty-result" />)

    expect(screen.getByRole('heading', { name: 'Todavía no simulaste' })).toBeVisible()
  })

  it('invalid lists the translated violations with their field and goes back', async () => {
    const onBack = vi.fn()
    const violations: StrategyViolation[] = [
      {
        code: 'LAPS_MISMATCH',
        field: 'stints',
        params: { expected: 53, actual: 51, difference: 2 },
        message: 'raw',
      },
      {
        code: 'NOT_ENOUGH_PIT_STOPS',
        field: 'stints',
        params: { required: 2, actual: 1 },
        message: 'raw',
      },
    ]
    render(<StatusPanel variant="invalid" violations={violations} onBack={onBack} />)

    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'El backend rechazó la estrategia' })).toBeVisible()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Faltan 2 vueltas')
    expect(items[1]).toHaveTextContent('Hace falta al menos 2 paradas')
    expect(screen.getAllByText('stints')).toHaveLength(2)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Volver a la estrategia' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('sim-loading shows the lap progress', () => {
    render(<StatusPanel variant="sim-loading" lap={34} totalLaps={53} />)

    expect(screen.getByText('Simulando vuelta 34/53…')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '34')
  })

  it('sim-loading with zero total laps shows 0% and no NaN', () => {
    const { container } = render(<StatusPanel variant="sim-loading" lap={0} totalLaps={0} />)

    expect(container).not.toHaveTextContent('NaN')
    expect(screen.getByText('0%')).toBeVisible()
    expect(container.querySelector('[role="progressbar"] > div')).toHaveStyle({ width: '0%' })
  })

  it('renders in English', async () => {
    const { default: i18n } = await import('@/shared/i18n')
    await i18n.changeLanguage('en')
    render(<StatusPanel variant="empty-race" />)

    expect(screen.getByRole('heading', { name: 'Pick a race' })).toBeVisible()
  })
})
