import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import type { StrategyViolation } from '@/shared/api/types'
import type { RainWarning } from './rain-warnings'
import { StrategyFeedback } from './strategy-feedback'

const MISMATCH: StrategyViolation = {
  code: 'LAPS_MISMATCH',
  field: 'stints',
  params: { expected: 53, actual: 51, difference: 2 },
  message: 'raw',
}

const WARNING: RainWarning = {
  stintIndex: 1,
  compound: 'SOFT',
  fromLap: 31,
  toLap: 53,
  rainIntensity: 0.35,
  lossPerLap: 5.4,
  idealCompound: 'INTERMEDIATE',
}

describe('StrategyFeedback', () => {
  it('renders nothing when the strategy is clean', () => {
    const { container } = render(<StrategyFeedback errors={[]} warnings={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lists translated errors', () => {
    render(<StrategyFeedback errors={[MISMATCH]} warnings={[]} />)

    const list = screen.getByRole('list', { name: 'Errores' })
    expect(list).toHaveTextContent(
      'Los stints suman 51 vueltas y la carrera tiene 53. Faltan 2 vueltas.',
    )
  })

  it('describes a rain warning with the loss and the ideal compound', () => {
    render(<StrategyFeedback errors={[]} warnings={[WARNING]} />)

    expect(screen.getByRole('list', { name: 'Avisos' })).toHaveTextContent(
      'Stint 2 · Blando corre V31–V53 con lluvia moderada (0.35). Perdés ≈5.4s por vuelta. Ideal: Intermedio.',
    )
  })

  it('omits the ideal compound when there is no better one', () => {
    render(<StrategyFeedback errors={[]} warnings={[{ ...WARNING, idealCompound: null }]} />)

    expect(screen.getByRole('list', { name: 'Avisos' })).not.toHaveTextContent('Ideal')
  })

  it('names a dry stretch for below-band warnings', () => {
    render(
      <StrategyFeedback
        errors={[]}
        warnings={[
          { ...WARNING, stintIndex: 0, compound: 'WET', fromLap: 1, toLap: 30, rainIntensity: 0 },
        ]}
      />,
    )

    expect(screen.getByRole('list', { name: 'Avisos' })).toHaveTextContent(
      'Stint 1 · Lluvia corre V1–V30 con seco (0).',
    )
  })

  it.each([
    [0.1, 'llovizna'],
    [0.35, 'lluvia moderada'],
    [0.7, 'lluvia fuerte'],
  ])('words a rain intensity of %s as "%s"', (rainIntensity, word) => {
    render(<StrategyFeedback errors={[]} warnings={[{ ...WARNING, rainIntensity }]} />)

    expect(screen.getByRole('list', { name: 'Avisos' })).toHaveTextContent(
      `con ${word} (${rainIntensity})`,
    )
  })

  it('speaks English', async () => {
    await i18n.changeLanguage('en')
    render(<StrategyFeedback errors={[MISMATCH]} warnings={[WARNING]} />)

    expect(screen.getByRole('list', { name: 'Errors' })).toBeVisible()
    expect(screen.getByRole('list', { name: 'Warnings' })).toHaveTextContent(
      'Stint 2 · Soft runs L31–L53 in moderate rain (0.35). You lose ≈5.4s per lap. Ideal: Intermediate.',
    )
  })
})
