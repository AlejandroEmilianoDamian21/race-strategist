import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Tyre } from '@/shared/api/types'
import { OVERVIEW } from './race-fixtures'
import { TyreCompounds } from './tyre-compounds'

const FORECAST = OVERVIEW.weather.forecast

function renderTyres(tyres: Tyre[] = OVERVIEW.tyres, tyreWear = 0.9) {
  render(<TyreCompounds tyres={tyres} tyreWear={tyreWear} forecast={FORECAST} />)
  return screen.getAllByRole('listitem')
}

describe('TyreCompounds', () => {
  it('lists each compound with pace, scaled degradation and optimal rain range', () => {
    const items = renderTyres()

    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Blando')).toBeVisible()
    expect(within(items[0]).getByText('S')).toBeInTheDocument()
    expect(within(items[0]).getByText('−1.0s')).toBeVisible()
    expect(within(items[0]).getByText('+0.090s/v')).toBeVisible()
    expect(within(items[0]).getByText('0–0.05')).toBeVisible()
    expect(within(items[1]).getByText('+0.5s')).toBeVisible()
    expect(within(items[2]).getByText('Lluvia')).toBeVisible()
  })

  it('renders zero and negative scaled degradation with the matching sign', () => {
    const [soft] = OVERVIEW.tyres
    renderTyres([
      { ...soft, compound: 'SOFT', degradation: 0 },
      { ...soft, compound: 'MEDIUM', degradation: -0.1 },
    ])

    expect(screen.getByText('±0.000s/v')).toBeVisible()
    expect(screen.getByText('−0.090s/v')).toBeVisible()
  })

  it('orders the compounds S, M, H, I, W regardless of the API order', () => {
    const [soft, hard, wet] = OVERVIEW.tyres
    const items = renderTyres([wet, soft, hard])

    expect(items.map((item) => item.textContent?.slice(0, 1))).toEqual(['S', 'H', 'W'])
  })

  it('dims a compound that fits no forecast segment and keeps the others at full strength', () => {
    const items = renderTyres()

    expect(items[0]).not.toHaveAttribute('data-dimmed')
    expect(items[1]).not.toHaveAttribute('data-dimmed')
    expect(items[2]).toHaveAttribute('data-dimmed', 'true')
    expect(items[2]).toHaveClass('opacity-45')
    expect(items[0]).not.toHaveClass('opacity-45')
  })

  it('paints the optimal range in the compound color with a 2% minimum width', () => {
    const items = renderTyres()

    const soft = within(items[0]).getByRole('img', { name: 'Lluvia óptima 0–0.05' })
    const range = soft.firstElementChild as HTMLElement
    expect(range).toHaveClass('bg-tyre-soft')
    expect(range.style.left).toBe('0%')
    expect(range.style.width).toBe('5%')
    const wet = within(items[2]).getByRole('img', { name: 'Lluvia óptima 0.6–1' })
    const wetRange = wet.firstElementChild as HTMLElement
    expect(wetRange).toHaveClass('bg-tyre-wet')
    expect(wetRange.style.left).toBe('60%')
    expect(wetRange.style.width).toBe('40%')
    const narrow = renderNarrow()
    expect(narrow.style.width).toBe('2%')
  })

  it('marks each distinct rain intensity of the race on every range', () => {
    const items = renderTyres()

    const marks = within(items[0]).getAllByTitle(/en esta carrera/)
    expect(marks.map((mark) => mark.getAttribute('title'))).toEqual([
      'Lluvia 0 en esta carrera',
      'Lluvia 0.35 en esta carrera',
    ])
    expect(marks.map((mark) => mark.style.left)).toEqual(['0%', '35%'])
  })

  it('scales the degradation bar against 0.13 s/lap', () => {
    const items = renderTyres()

    const bar = within(items[0]).getByRole('meter', { name: 'Degradación aquí' })
    expect(bar).toHaveAttribute('aria-valuenow', '0.09')
    expect(Number.parseFloat((bar.firstElementChild as HTMLElement).style.width)).toBeCloseTo(
      (0.09 / 0.13) * 100,
      5,
    )
    expect(bar.firstElementChild).toHaveClass('bg-warning')
  })

  it('explains the card with the reference footnote', () => {
    renderTyres()

    expect(screen.getByText('baseLapTime').tagName).toBe('CODE')
    expect(screen.getByText('tyreWear').tagName).toBe('CODE')
    expect(screen.getByText(/de este circuito/)).toHaveTextContent(
      'Ritmo vs. baseLapTime (negativo = más rápido). Degradación × tyreWear 0.9 de este circuito. Las marcas ▏ son las intensidades de lluvia de esta carrera; atenuados, los compuestos que no encajan en ningún tramo.',
    )
  })
})

function renderNarrow(): HTMLElement {
  const [soft] = OVERVIEW.tyres
  const { container } = render(
    <TyreCompounds
      tyres={[{ ...soft, compound: 'MEDIUM', optimalRainIntensity: { min: 0.2, max: 0.2 } }]}
      tyreWear={1}
      forecast={FORECAST}
    />,
  )
  return container.querySelector('[role="img"] > i') as HTMLElement
}
