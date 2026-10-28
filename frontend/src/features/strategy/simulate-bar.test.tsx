import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SimulateBar } from './simulate-bar'

interface Options {
  errorCount?: number
  hasDriver?: boolean
  progress?: number | null
}

function renderBar({ errorCount = 0, hasDriver = true, progress = null }: Options = {}) {
  const onSimulate = vi.fn()
  const onAddStop = vi.fn()
  render(
    <SimulateBar
      errorCount={errorCount}
      hasDriver={hasDriver}
      raceLaps={70}
      progress={progress}
      onAddStop={onAddStop}
      onSimulate={onSimulate}
    />,
  )
  return { onSimulate, onAddStop }
}

describe('SimulateBar', () => {
  it('offers the add-stop action and an enabled SIMULAR when the strategy is valid', async () => {
    const { onSimulate, onAddStop } = renderBar()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Agregar parada' }))
    await user.click(screen.getByRole('button', { name: 'Simular' }))

    expect(onAddStop).toHaveBeenCalledTimes(1)
    expect(onSimulate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/para simular/)).not.toBeInTheDocument()
  })

  it.each([
    [1, 'Corregí 1 error para simular'],
    [3, 'Corregí 3 errores para simular'],
  ])('disables SIMULAR with the reason for %i errors', async (errorCount, reason) => {
    const { onSimulate } = renderBar({ errorCount })
    const button = screen.getByRole('button', { name: 'Simular' })

    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(reason)
    await userEvent.setup().click(button)
    expect(onSimulate).not.toHaveBeenCalled()
  })

  it('asks for a driver when the strategy is valid but nobody is picked', () => {
    renderBar({ hasDriver: false })

    expect(screen.getByRole('button', { name: 'Simular' })).toBeDisabled()
    expect(screen.getByText('Elegí un piloto para simular')).toBeVisible()
  })

  it('prefers the error count over the missing driver', () => {
    renderBar({ errorCount: 2, hasDriver: false })

    expect(screen.getByText('Corregí 2 errores para simular')).toBeVisible()
    expect(screen.queryByText('Elegí un piloto para simular')).not.toBeInTheDocument()
  })

  it('shows the simulation progress with its lap and a busy button', async () => {
    const { onSimulate } = renderBar({ progress: 0.5 })
    const button = screen.getByRole('button', { name: /Simulando vuelta 35\/70/ })

    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('span[style*="width: 50%"]')).not.toBeNull()
    await userEvent.setup().click(button)
    expect(onSimulate).not.toHaveBeenCalled()
  })

  it('starts the progress at lap 1', () => {
    renderBar({ progress: 0 })

    expect(screen.getByRole('button', { name: /Simulando vuelta 1\/70/ })).toBeVisible()
  })
})
