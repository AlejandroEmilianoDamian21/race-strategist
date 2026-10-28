import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import type { StrategyViolation } from '@/shared/api/types'
import type { RainWarning } from './rain-warnings'
import { StrategyIssues } from './strategy-issues'

function mismatch(actual: number, expected = 70): StrategyViolation {
  return {
    code: 'LAPS_MISMATCH',
    field: 'stints',
    params: { expected, actual, difference: expected - actual },
    message: 'raw',
  }
}

const WARNING: RainWarning = {
  stintIndex: 0,
  compound: 'SOFT',
  fromLap: 25,
  toLap: 30,
  rainIntensity: 0.35,
  band: { min: 0, max: 0.05 },
  lossPerLap: 5.4,
  idealCompounds: ['INTERMEDIATE'],
}

function renderIssues(
  props: Partial<{
    errors: StrategyViolation[]
    warnings: RainWarning[]
    stops: number
    raceLaps: number
  }> = {},
) {
  return render(<StrategyIssues errors={[]} warnings={[]} stops={1} raceLaps={70} {...props} />)
}

describe('StrategyIssues', () => {
  it('is a polite live region, present even without messages', () => {
    renderIssues({ errors: [mismatch(66)] })

    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite')
    expect(document.querySelector('ul[aria-live="polite"]')).not.toBeNull()
  })

  it('confirms a valid strategy with its stops and covered laps', () => {
    renderIssues({ stops: 2 })

    expect(screen.getByText('Estrategia válida · 2 paradas · cubre las 70 vueltas.')).toBeVisible()
  })

  it.each([
    [0, 'Estrategia válida · Sin paradas · cubre las 70 vueltas.'],
    [1, 'Estrategia válida · 1 parada · cubre las 70 vueltas.'],
  ])('words %i stops in the valid message', (stops, text) => {
    renderIssues({ stops })

    expect(screen.getByText(text)).toBeVisible()
  })

  it('describes missing laps with bold figures and no valid message', () => {
    renderIssues({ errors: [mismatch(66)] })

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent(
      'Los stints suman 66 vueltas y la carrera tiene 70. Faltan 4 vueltas por cubrir.',
    )
    expect(within(item).getByText('66 vueltas').tagName).toBe('B')
    expect(within(item).getByText('70').tagName).toBe('B')
    expect(screen.queryByText(/Estrategia válida/)).not.toBeInTheDocument()
  })

  it('uses the singular for one missing lap and words surplus laps', () => {
    const { unmount } = renderIssues({ errors: [mismatch(69)] })
    expect(screen.getByRole('listitem')).toHaveTextContent('Faltan 1 vuelta por cubrir.')
    unmount()

    renderIssues({ errors: [mismatch(73)] })
    expect(screen.getByRole('listitem')).toHaveTextContent('Sobran 3 vueltas.')
  })

  it('names the stint that is too short or has no compound', () => {
    renderIssues({
      errors: [
        {
          code: 'STINT_TOO_SHORT',
          field: 'stints[1].laps',
          params: { stint: 2, laps: 0 },
          message: 'raw',
        },
        {
          code: 'UNKNOWN_COMPOUND',
          field: 'stints[2].compound',
          params: { stint: 3, compound: 'X', allowed: '' },
          message: 'raw',
        },
      ],
    })

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Stint 2 necesita al menos 1 vuelta.')
    expect(items[1]).toHaveTextContent('Stint 3 no tiene compuesto.')
  })

  it('asks for the minimum pit stops quoting the API field', () => {
    renderIssues({
      errors: [
        {
          code: 'NOT_ENOUGH_PIT_STOPS',
          field: 'stints',
          params: { required: 2, actual: 1 },
          message: 'raw',
        },
      ],
    })

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent(
      'Esta carrera exige al menos 2 paradas (minimumPitStops). Agregá una.',
    )
    expect(within(item).getByText('minimumPitStops').tagName).toBe('CODE')
  })

  it('describes a rain warning with its band, the loss and the ideal compounds', () => {
    renderIssues({ warnings: [{ ...WARNING, idealCompounds: ['INTERMEDIATE', 'WET'] }] })

    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
      'Stint 1 · Blando corre V25–V30 con lluvia moderada (0.35). Rinde entre 0 y 0.05: perdés ≈5.4s por vuelta. Ideal: Intermedio o Lluvia.',
    )
  })

  it('omits the ideal sentence when no compound fits', () => {
    renderIssues({ warnings: [{ ...WARNING, idealCompounds: [] }] })

    expect(screen.getAllByRole('listitem')[0]).not.toHaveTextContent('Ideal')
  })

  it('keeps warnings after the errors and does not call the strategy valid with warnings only', () => {
    renderIssues({ errors: [mismatch(66)], warnings: [WARNING] })

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Los stints suman')
    expect(items[1]).toHaveTextContent('Stint 1 · Blando corre')
  })

  it('still confirms the strategy when only warnings exist', () => {
    renderIssues({ warnings: [WARNING] })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText(/Estrategia válida/)).toBeVisible()
  })

  it('speaks English when the language changes', async () => {
    await i18n.changeLanguage('en')
    renderIssues({ errors: [mismatch(66)] })

    expect(screen.getByRole('listitem')).toHaveTextContent(
      'The stints add up to 66 laps and the race has 70. 4 laps left to cover.',
    )
  })
})
