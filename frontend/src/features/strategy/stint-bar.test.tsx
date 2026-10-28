import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import type { Stint } from '@/shared/api/types'
import { StintBar } from './stint-bar'

const STINTS: Stint[] = [
  { compound: 'MEDIUM', laps: 23 },
  { compound: 'HARD', laps: 30 },
]

interface BarOptions {
  stints?: Stint[]
  errors?: number[]
  warnings?: number[]
}

function renderBar({ stints = STINTS, errors = [], warnings = [] }: BarOptions = {}) {
  const onMovePit = vi.fn()
  render(
    <StintBar
      stints={stints}
      raceLaps={53}
      forecast={OVERVIEW.weather.forecast}
      tyres={OVERVIEW.tyres}
      errorStints={new Set(errors)}
      warningStints={new Set(warnings)}
      onMovePit={onMovePit}
    />,
  )
  const bar = screen.getByRole('list', { name: 'Stints de la estrategia' })
  return { onMovePit, bar, items: within(bar).getAllByRole('listitem') }
}

describe('StintBar', () => {
  it('draws one proportional segment per stint with name, range and laps', () => {
    const { items } = renderBar()

    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAttribute('aria-label', 'Stint 1: Medio, vueltas 1 a 23')
    expect(items[0]).toHaveTextContent('Medio')
    expect(items[0]).toHaveTextContent('V1–V23 · 23 v')
    expect(items[1]).toHaveTextContent('Duro')
    expect(items[1]).toHaveTextContent('V24–V53 · 30 v')
    expect(items[0]?.style.flex).toBe('23 1 0px')
    expect(items[1]?.style.flex).toBe('30 1 0px')
  })

  it('puts the weather band above the bar and a lap axis below', () => {
    renderBar()

    expect(screen.getByRole('list', { name: 'Clima por tramos' })).toBeVisible()
    expect(screen.getByText('V1')).toBeVisible()
    expect(screen.getByText('V53')).toBeVisible()
  })

  it('hides the weather band when the stints exceed the race', () => {
    renderBar({
      stints: [
        { compound: 'MEDIUM', laps: 40 },
        { compound: 'HARD', laps: 30 },
      ],
    })

    expect(screen.queryByRole('list', { name: 'Clima por tramos' })).not.toBeInTheDocument()
  })

  it('marks a pit stop pin at every stop and none after the last stint', () => {
    renderBar()

    expect(screen.getAllByText(/^V23$/)).toHaveLength(1)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('draws a hatched segment with the missing laps', () => {
    const { items } = renderBar({
      stints: [
        { compound: 'MEDIUM', laps: 23 },
        { compound: 'HARD', laps: 20 },
      ],
    })

    const gap = items[2]!
    expect(items).toHaveLength(3)
    expect(gap).toHaveAttribute('aria-label', 'Faltan 10 vueltas')
    expect(gap).toHaveTextContent('Faltan 10')
    expect(gap).toHaveTextContent('V44–V53')
    expect(gap.style.flex).toBe('10 1 0px')
  })

  it('shortens the label of a narrow gap', () => {
    const { items } = renderBar({
      stints: [
        { compound: 'MEDIUM', laps: 23 },
        { compound: 'HARD', laps: 28 },
      ],
    })

    expect(items[2]).toHaveTextContent('2 v')
    expect(items[2]).not.toHaveTextContent('Faltan 2')
  })

  it('marks only the stints with errors or warnings', () => {
    const { items } = renderBar({ errors: [1], warnings: [0] })

    expect(items[0]).not.toHaveAttribute('data-invalid')
    expect(items[0]).toHaveAttribute('data-warning', 'true')
    expect(items[1]).toHaveAttribute('data-invalid', 'true')
    expect(items[1]).not.toHaveAttribute('data-warning')
  })

  it('moves the pit with the arrow keys from the current lap', () => {
    const { onMovePit } = renderBar()
    const handle = screen.getByRole('button', { name: 'Mover parada 1 (vuelta 23)' })

    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    fireEvent.keyDown(handle, { key: 'Enter' })

    expect(onMovePit).toHaveBeenNthCalledWith(1, 0, 24)
    expect(onMovePit).toHaveBeenNthCalledWith(2, 0, 22)
    expect(onMovePit).toHaveBeenCalledTimes(2)
  })

  it('drags the handle along the bar and stops on release', () => {
    const { onMovePit, bar } = renderBar()
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 530,
      right: 630,
      top: 0,
      bottom: 0,
      height: 0,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    })
    const handle = screen.getByRole('button', { name: 'Mover parada 1 (vuelta 23)' })

    fireEvent.pointerDown(handle, { clientX: 340 })
    fireEvent.pointerMove(window, { clientX: 365 })
    expect(onMovePit).toHaveBeenLastCalledWith(0, 26.5)

    fireEvent.pointerUp(window)
    fireEvent.pointerMove(window, { clientX: 500 })
    expect(onMovePit).toHaveBeenCalledTimes(1)
  })

  it('has no handle with a single stint', () => {
    renderBar({ stints: [{ compound: 'HARD', laps: 53 }] })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
