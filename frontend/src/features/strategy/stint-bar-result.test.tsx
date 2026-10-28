import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import { buildResult, ONE_STOP, TWO_STOPS } from '@/features/result/result-fixtures'
import { StintBar } from './stint-bar'

const result = buildResult(TWO_STOPS)
const stints = result.stints.map((stint) => ({ compound: stint.compound, laps: stint.laps }))

function bar(extra: Partial<React.ComponentProps<typeof StintBar>> = {}) {
  return render(
    <StintBar
      stints={stints}
      raceLaps={10}
      forecast={OVERVIEW.weather.forecast.map((segment) => ({
        ...segment,
        toLap: Math.min(segment.toLap, 10),
      }))}
      tyres={OVERVIEW.tyres}
      result={{ stints: result.stints, pitStops: result.pitStops }}
      {...extra}
    />,
  )
}

describe('StintBar in result mode', () => {
  it('shows the time of each stint', () => {
    bar()

    const list = screen.getByRole('list', { name: 'Stints de la estrategia' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('5:20.6')
    expect(items[0]).toHaveAccessibleName('Stint 1: Medio, vueltas 1 a 4, 5:20.6')
  })

  it('shows the pit marker with its cost', () => {
    bar()

    expect(screen.getByText('V4', { selector: 'div' })).toHaveTextContent('V4 +22.0s')
    expect(screen.getByText('V7', { selector: 'div' })).toHaveTextContent('V7 +22.0s')
  })

  it('has no drag handles', () => {
    bar()

    expect(screen.queryAllByRole('slider')).toHaveLength(0)
  })

  it('draws a thinner ghost bar of the previous strategy when given one', () => {
    const ghost = buildResult(ONE_STOP).stints.map((stint) => ({
      compound: stint.compound,
      laps: stint.laps,
    }))
    bar({ ghost })

    const list = screen.getByRole('list', { name: 'Estrategia anterior' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(list).toHaveClass('h-3.5')
  })

  it('has no ghost bar by default', () => {
    bar()

    expect(screen.queryByRole('list', { name: 'Estrategia anterior' })).not.toBeInTheDocument()
  })

  it('draws the compact weather band without lap ranges', () => {
    bar()

    const band = screen.getByRole('list', { name: 'Clima por tramos' })
    expect(band).toHaveClass('h-[22px]')
    const first = within(band).getAllByRole('listitem')[0]!
    expect(first).toHaveTextContent('28° · seco')
    expect(first).not.toHaveTextContent('V1')
  })

  it('can hide the weather band', () => {
    bar({ weather: false })

    expect(screen.queryByRole('list', { name: 'Clima por tramos' })).not.toBeInTheDocument()
  })
})
