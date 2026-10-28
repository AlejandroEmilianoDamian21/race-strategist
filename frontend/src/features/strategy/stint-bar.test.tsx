import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import type { Stint } from '@/shared/api/types'
import { StintBar } from './stint-bar'

const STINTS: Stint[] = [
  { compound: 'MEDIUM', laps: 23 },
  { compound: 'HARD', laps: 30 },
]

function renderBar(stints: Stint[] = STINTS, invalid: number[] = []) {
  render(
    <StintBar
      stints={stints}
      raceLaps={53}
      forecast={OVERVIEW.weather.forecast}
      invalidStints={new Set(invalid)}
    />,
  )
  return within(screen.getByRole('list', { name: 'Stints de la estrategia' })).getAllByRole(
    'listitem',
  )
}

function widthOf(element: HTMLElement): number {
  return Number.parseFloat(element.style.width)
}

describe('StintBar', () => {
  it('draws one segment per stint with compound letter, laps and a proportional width', () => {
    const items = renderBar()

    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('M')
    expect(items[0]).toHaveTextContent('23')
    expect(items[0]).toHaveTextContent('Stint 1 · Medio')
    expect(items[1]).toHaveTextContent('H')
    expect(items[1]).toHaveTextContent('Stint 2 · Duro')
    expect(widthOf(items[0]!)).toBeCloseTo((23 / 53) * 100, 5)
    expect(widthOf(items[1]!)).toBeCloseTo((30 / 53) * 100, 5)
  })

  it('marks only the invalid stints', () => {
    const items = renderBar(STINTS, [1])

    expect(items[0]).not.toHaveAttribute('data-invalid')
    expect(items[1]).toHaveAttribute('data-invalid', 'true')
  })

  it('shrinks the segments to fit when the stints exceed the race', () => {
    const items = renderBar([
      { compound: 'MEDIUM', laps: 53 },
      { compound: 'HARD', laps: 53 },
    ])

    expect(widthOf(items[0]!)).toBeCloseTo(50, 5)
    expect(widthOf(items[1]!)).toBeCloseTo(50, 5)
  })

  it('leaves the rest of the track empty when the stints fall short', () => {
    const items = renderBar([{ compound: 'MEDIUM', laps: 26 }])

    expect(widthOf(items[0]!)).toBeCloseTo((26 / 53) * 100, 5)
  })

  it('gives a zero-lap stint no width and an unknown compound a neutral name', () => {
    const items = renderBar([
      { compound: 'SLICK', laps: 0 },
      { compound: 'HARD', laps: 53 },
    ])

    expect(widthOf(items[0]!)).toBe(0)
    expect(items[0]).toHaveTextContent('Stint 1 · SLICK')
  })

  it('shows the first and last lap of the race', () => {
    renderBar()

    expect(screen.getByText('V1')).toBeVisible()
    expect(screen.getByText('V53')).toBeVisible()
  })

  it('draws the weather band positioned by lap and tinted only for rain', () => {
    renderBar()

    const band = screen.getByTestId('weather-band')
    const [dry, wet] = Array.from(band.children) as HTMLElement[]
    expect(dry).toHaveAttribute('data-rain', '0')
    expect(dry?.style.left).toBe('0%')
    expect(Number.parseFloat(dry!.style.width)).toBeCloseTo((30 / 53) * 100, 5)
    expect(wet).toHaveAttribute('data-rain', '0.35')
    expect(Number.parseFloat(wet!.style.left)).toBeCloseTo((30 / 53) * 100, 5)
    expect(Number.parseFloat(wet!.style.width)).toBeCloseTo((23 / 53) * 100, 5)
    expect(Number.parseFloat(wet!.style.opacity)).toBeGreaterThan(
      Number.parseFloat(dry!.style.opacity),
    )
  })
})
