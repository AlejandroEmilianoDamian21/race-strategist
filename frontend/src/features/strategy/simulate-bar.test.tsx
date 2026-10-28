import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileCtaHostContext } from '@/shared/layout/mobile-cta-host'
import { SimulateBar } from './simulate-bar'

interface Options {
  errorCount?: number
  hasDriver?: boolean
  progress?: number | null
  canAddStop?: boolean
}

function renderBar({
  errorCount = 0,
  hasDriver = true,
  progress = null,
  canAddStop = true,
}: Options = {}) {
  const onSimulate = vi.fn()
  const onAddStop = vi.fn()
  render(
    <SimulateBar
      errorCount={errorCount}
      hasDriver={hasDriver}
      raceLaps={70}
      progress={progress}
      canAddStop={canAddStop}
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

  it('disables the add-stop action with a reason when no stint can be split', async () => {
    const { onAddStop } = renderBar({ canAddStop: false })
    const button = screen.getByRole('button', { name: 'Agregar parada' })

    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription('Cada stint ya tiene 1 vuelta')
    await userEvent.setup().click(button)
    expect(onAddStop).not.toHaveBeenCalled()
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

  describe('mobile action bar', () => {
    function renderWithHost(options: Options = {}) {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const onSimulate = vi.fn()
      const { errorCount = 0, hasDriver = true, progress = null } = options
      const view = render(
        <MobileCtaHostContext.Provider value={host}>
          <SimulateBar
            errorCount={errorCount}
            hasDriver={hasDriver}
            raceLaps={70}
            progress={progress}
            canAddStop
            onAddStop={vi.fn()}
            onSimulate={onSimulate}
          />
        </MobileCtaHostContext.Provider>,
      )
      return { host, onSimulate, view }
    }

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('mirrors an enabled SIMULAR into the bar and runs the simulation from it', async () => {
      const { host, onSimulate } = renderWithHost()

      await userEvent.setup().click(within(host).getByRole('button', { name: 'Simular' }))

      expect(onSimulate).toHaveBeenCalledTimes(1)
    })

    it('shows the short reason beside a disabled SIMULAR', () => {
      const { host } = renderWithHost({ errorCount: 2 })

      expect(within(host).getByRole('button', { name: 'Simular' })).toBeDisabled()
      expect(within(host).getByText('Corregí errores')).toBeVisible()
    })

    it('asks for a driver in the bar when nobody is picked', () => {
      const { host } = renderWithHost({ hasDriver: false })

      expect(within(host).getByRole('button', { name: 'Simular' })).toBeDisabled()
      expect(within(host).getByText('Elegí un piloto para simular')).toBeVisible()
    })

    it('shows the simulation progress in the bar', () => {
      const { host } = renderWithHost({ progress: 0.5 })

      const button = within(host).getByRole('button', { name: 'Simulando 35/70' })
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('hides the inline primary action on mobile but keeps add-stop', () => {
      const { view } = renderWithHost()

      const inline = view.container.querySelector('.max-\\[720px\\]\\:\\[\\&_button\\]\\:hidden')
      expect(inline).not.toBeNull()
      expect(inline).toHaveTextContent('Simular')
      expect(inline).not.toHaveTextContent('Agregar parada')
    })
  })
})
