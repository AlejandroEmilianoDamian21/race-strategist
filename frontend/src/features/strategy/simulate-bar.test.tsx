import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/shared/i18n'
import { SimulateBar } from './simulate-bar'

function renderBar(errorCount: number, hasDriver: boolean) {
  const onSimulate = vi.fn()
  render(<SimulateBar errorCount={errorCount} hasDriver={hasDriver} onSimulate={onSimulate} />)
  return onSimulate
}

describe('SimulateBar', () => {
  it('is disabled with the singular error reason', () => {
    renderBar(1, true)

    const button = screen.getByRole('button', { name: 'Simular' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Corregí 1 error para simular')
  })

  it('pluralises the error reason', () => {
    renderBar(3, true)

    expect(screen.getByText('Corregí 3 errores para simular')).toBeVisible()
  })

  it('asks for a driver when there are no errors', () => {
    renderBar(0, false)

    expect(screen.getByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Elegí un piloto para simular')).toBeVisible()
  })

  it('prefers the error reason when both apply', () => {
    renderBar(2, false)

    expect(screen.getByText('Corregí 2 errores para simular')).toBeVisible()
    expect(screen.queryByText('Elegí un piloto para simular')).not.toBeInTheDocument()
  })

  it('emits the simulate event once enabled', async () => {
    const onSimulate = renderBar(0, true)
    const button = screen.getByRole('button', { name: 'Simular' })

    expect(button).toBeEnabled()
    await userEvent.setup().click(button)

    expect(onSimulate).toHaveBeenCalledTimes(1)
  })

  it('does not emit while disabled', async () => {
    const onSimulate = renderBar(1, true)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Simular' }))

    expect(onSimulate).not.toHaveBeenCalled()
  })

  it('speaks English', async () => {
    await i18n.changeLanguage('en')
    renderBar(1, true)

    expect(screen.getByRole('button', { name: 'Simulate' })).toBeDisabled()
    expect(screen.getByText('Fix 1 error to simulate')).toBeVisible()
  })
})
