import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LapTimeChart } from './lap-time-chart'
import { buildResult, ONE_STOP, TWO_STOPS } from './result-fixtures'

const forecast = [
  { fromLap: 1, toLap: 4, temperature: 20, rainIntensity: 0 },
  { fromLap: 5, toLap: 10, temperature: 18, rainIntensity: 0.35 },
]

function chart(previous = false) {
  const view = render(
    <LapTimeChart
      result={buildResult(TWO_STOPS)}
      previous={previous ? buildResult(ONE_STOP) : null}
      forecast={forecast}
    />,
  )
  const svg = view.container.querySelector('svg')!
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1000, height: 300, right: 1000, bottom: 300 }) as DOMRect
  return { ...view, svg }
}

describe('LapTimeChart', () => {
  it('has a title, a legend and an accessible chart', () => {
    chart()

    expect(screen.getByRole('heading', { name: 'Tiempo por vuelta' })).toBeVisible()
    expect(screen.getByText('Esta simulación')).toBeVisible()
    expect(screen.getByText('Parada')).toBeVisible()
    expect(screen.getAllByText('Lluvia').length).toBeGreaterThan(0)
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(/Tiempo por vuelta: sube con el desgaste/)
  })

  it('labels each stint band and annotates each pit stop', () => {
    const { container } = chart()

    expect(container.querySelectorAll('rect[data-band]')).toHaveLength(3)
    expect(screen.getByText('BOX V4 · +22.0s ↑')).toBeInTheDocument()
    expect(screen.getByText('BOX V7 · +22.0s ↑')).toBeInTheDocument()
    expect(screen.getAllByText('Medio').length).toBeGreaterThan(0)
  })

  it('draws the rain strip only where it rains', () => {
    const { container } = chart()

    expect(container.querySelectorAll('rect[data-rain]')).toHaveLength(1)
  })

  it('draws the previous line, dashed, only when comparing', () => {
    const { container, rerender } = chart(false)
    expect(container.querySelector('path[data-series="previous"]')).toBeNull()
    expect(container.querySelector('path[data-series="current"]')).not.toBeNull()

    rerender(
      <LapTimeChart
        result={buildResult(TWO_STOPS)}
        previous={buildResult(ONE_STOP)}
        forecast={forecast}
      />,
    )
    expect(container.querySelector('path[data-series="previous"]')).not.toBeNull()
    expect(screen.getByText('Anterior')).toBeVisible()
  })

  it('shows a tooltip with the lap details on hover and hides it on leave', () => {
    const { container } = chart()
    const hit = container.querySelector('rect[data-hit]')!

    fireEvent.pointerMove(hit, { clientX: 56 + 3 * ((1000 - 56 - 12) / 9) })
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Vuelta 4')
    expect(tip).toHaveTextContent('1:42.300')
    expect(tip).toHaveTextContent('4ª vuelta del medio')
    expect(tip).toHaveTextContent('Incluye parada en boxes')
    expect(tip).not.toHaveTextContent('Lluvia')

    fireEvent.pointerLeave(hit)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('says how much the wrong compound costs under rain', () => {
    const { container } = chart()
    const hit = container.querySelector('rect[data-hit]')!

    fireEvent.pointerMove(hit, { clientX: 56 + 8 * ((1000 - 56 - 12) / 9) })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Lluvia 0.35 · +1.5s por compuesto')
  })

  it('says the compound is right when the rain costs nothing', () => {
    const { container } = chart()
    const hit = container.querySelector('rect[data-hit]')!

    fireEvent.pointerMove(hit, { clientX: 56 + 5 * ((1000 - 56 - 12) / 9) })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Lluvia 0.35 · compuesto correcto')
  })

  it('shows the previous time in the tooltip when comparing', () => {
    const { container } = chart(true)
    const hit = container.querySelector('rect[data-hit]')!

    fireEvent.pointerMove(hit, { clientX: 56 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Anterior: 1:22.000')
  })
})
