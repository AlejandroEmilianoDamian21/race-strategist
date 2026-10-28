import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '@/shared/api/app-error'
import type { StrategyViolation } from '@/shared/api/types'
import { StatusPanel } from './status-panel'

describe('StatusPanel', () => {
  it('wake shows the title, elapsed time and progress', () => {
    render(<StatusPanel variant="wake" elapsedSeconds={23} />)

    expect(screen.getByRole('status')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Despertando el servidor' })).toBeVisible()
    expect(screen.getByText('0:23 de ~1:00')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '23')
  })

  it('api-error describes the failure and retries', async () => {
    const onRetry = vi.fn()
    render(<StatusPanel variant="api-error" error={new AppError('network')} onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'No pudimos leer los datos de F1' })).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('api-error explains the upstream reason and shows the technical line', () => {
    render(
      <StatusPanel
        variant="api-error"
        error={
          new AppError('upstream', {
            status: 502,
            code: 'UPSTREAM_UNAVAILABLE',
            details: { reason: 'timeout', resource: '/api/races' },
          })
        }
        onRetry={() => {}}
      />,
    )

    expect(screen.getByText(/tardó demasiado en responder/)).toBeVisible()
    expect(screen.getByText('502 · UPSTREAM_UNAVAILABLE')).toBeVisible()
  })

  it('api-error for not-found offers to go back instead of retrying', () => {
    render(
      <StatusPanel
        variant="api-error"
        error={new AppError('not-found', { status: 404 })}
        onRetry={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No encontramos esa carrera' })).toBeVisible()
  })

  it('empty-race shows its title', () => {
    render(<StatusPanel variant="empty-race" />)

    expect(screen.getByRole('heading', { name: 'Elegí una carrera' })).toBeVisible()
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

  it('renders in English', async () => {
    const { default: i18n } = await import('@/shared/i18n')
    await i18n.changeLanguage('en')
    render(<StatusPanel variant="empty-race" />)

    expect(screen.getByRole('heading', { name: 'Pick a race' })).toBeVisible()
  })
})
