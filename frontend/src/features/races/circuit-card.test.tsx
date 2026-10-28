import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CircuitCard } from './circuit-card'
import { OVERVIEW } from './race-fixtures'

function renderCard(
  overrides: { circuit?: Partial<typeof OVERVIEW.circuit>; rain?: number; safetyCar?: number } = {},
) {
  render(
    <CircuitCard
      circuit={{ ...OVERVIEW.circuit, ...overrides.circuit }}
      parameters={{
        ...OVERVIEW.parameters,
        safetyCarProbability: overrides.safetyCar ?? OVERVIEW.parameters.safetyCarProbability,
      }}
      rainProbability={overrides.rain ?? OVERVIEW.race.rainProbability}
    />,
  )
}

describe('CircuitCard', () => {
  it('shows the circuit identity and the four figures with their labels', () => {
    renderCard()

    expect(screen.getByRole('heading', { name: 'Autodromo Nazionale Monza' })).toBeVisible()
    expect(screen.getByText('Circuito · Italy · Permanente')).toBeVisible()
    const figures = screen.getAllByRole('term').map((term) => term.textContent)
    expect(figures).toEqual(['Vueltas', 'Km / vuelta', 'Km totales', 'Vuelta base'])
    const values = screen.getAllByRole('definition').map((value) => value.textContent)
    expect(values).toEqual(['53', '5.793', '307.0', '1:21.500'])
  })

  it('exposes the four meters with reference values and captions', () => {
    renderCard()

    const wear = screen.getByRole('meter', { name: 'Desgaste de neumáticos' })
    expect(wear).toHaveAttribute('aria-valuenow', '0.9')
    expect(wear).toHaveAttribute('aria-valuemax', '1.5')
    const pit = screen.getByRole('meter', { name: 'Costo de una parada' })
    expect(pit).toHaveAttribute('aria-valuenow', '22')
    expect(pit).toHaveAttribute('aria-valuemax', '30')
    expect(screen.getByRole('meter', { name: 'Dificultad para adelantar' })).toHaveAttribute(
      'aria-valuenow',
      '0.4',
    )
    expect(screen.getByRole('meter', { name: 'Probabilidad de safety car' })).toHaveAttribute(
      'aria-valuenow',
      '0.25',
    )
    expect(screen.getAllByRole('meter')).toHaveLength(4)
    for (const text of ['×0.9', '22.0s', '0.4', '25%']) expect(screen.getByText(text)).toBeVisible()
    for (const caption of [
      '1.0 es neutro',
      '19.5s pit lane + 2.5s cambio',
      '0 fácil · 1 imposible',
      'No entra en la simulación',
    ]) {
      expect(screen.getByText(caption)).toBeVisible()
    }
  })

  it('fills the meters with the ink color except tyre wear', () => {
    renderCard()

    const fill = (name: string) =>
      screen.getByRole('meter', { name }).firstElementChild as HTMLElement
    expect(fill('Desgaste de neumáticos')).toHaveClass('bg-warning')
    expect(fill('Costo de una parada')).toHaveClass('bg-ink')
    expect(fill('Dificultad para adelantar')).toHaveClass('bg-ink')
    expect(fill('Probabilidad de safety car')).toHaveClass('bg-ink')
    expect(fill('Costo de una parada').style.width).toBe(`${(22 / 30) * 100}%`)
  })

  it('reads the strategy from the rules', () => {
    renderCard()

    const reading = screen.getByRole('list', { name: 'Lectura de estrategia' })
    const items = within(reading).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent(
      'Desgaste bajo (×0.9): los neumáticos aguantan, una parada suele alcanzar.',
    )
  })

  it('stacks every applicable reading sentence', () => {
    renderCard({
      circuit: { tyreWear: 1.3, overtakingDifficulty: 0.9 },
      rain: 0.65,
      safetyCar: 0.6,
    })

    const items = within(screen.getByRole('list', { name: 'Lectura de estrategia' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.textContent)).toEqual([
      'Desgaste alto (×1.3): los blandos duran poco, conviene parar más o usar duros.',
      'Adelantar es casi imposible (0.9): la posición en pista vale más que neumáticos frescos.',
      'Probabilidad de lluvia del 65%: mirá el pronóstico por tramos antes de elegir compuestos.',
      'Safety car muy probable (60%).',
    ])
  })

  it('says the circuit is balanced when no rule applies', () => {
    renderCard({ circuit: { tyreWear: 1, overtakingDifficulty: 0.5 }, rain: 0.2, safetyCar: 0.2 })

    expect(
      screen.getByText('Circuito equilibrado: desgaste y pérdida en boxes cerca de la media.'),
    ).toBeVisible()
  })

  it('draws no circuit silhouette', () => {
    const { container } = render(
      <CircuitCard
        circuit={OVERVIEW.circuit}
        parameters={OVERVIEW.parameters}
        rainProbability={OVERVIEW.race.rainProbability}
      />,
    )

    expect(container.querySelector('path[stroke-width="6"]')).toBeNull()
  })
})
