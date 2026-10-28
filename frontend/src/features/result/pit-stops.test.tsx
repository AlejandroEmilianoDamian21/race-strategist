import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PitStops } from './pit-stops'
import { buildResult, NO_STOP, TWO_STOPS } from './result-fixtures'

describe('PitStops', () => {
  it('lists each stop with its lap, compound change and cost', () => {
    render(<PitStops result={buildResult(TWO_STOPS)} />)

    expect(screen.getByRole('heading', { name: 'Paradas en boxes' })).toBeVisible()
    expect(screen.getByText('2 paradas')).toBeVisible()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('V4')
    expect(items[0]).toHaveTextContent('Medio → Intermedio')
    expect(items[0]).toHaveTextContent('+22.0s')
    expect(items[1]).toHaveTextContent('V7')
    expect(items[1]).toHaveTextContent('Intermedio → Lluvia')
  })

  it('shows the total lost in the pits and the cost note', () => {
    render(<PitStops result={buildResult(TWO_STOPS)} />)

    expect(screen.getByText('Total perdido en boxes').parentElement).toHaveTextContent(
      'Total perdido en boxes+44.0s',
    )
    expect(screen.getByText(/Cada parada = 19.5s en pit lane/).parentElement).toHaveTextContent(
      'Cada parada = 19.5s en pit lane (pitStopLoss) + 2.5s de cambio (tyreChangeTime).',
    )
  })

  it('says there were no stops', () => {
    render(<PitStops result={buildResult(NO_STOP)} />)

    expect(screen.getByText('0 paradas')).toBeVisible()
    expect(screen.getByText('Sin paradas: un solo stint de principio a fin.')).toBeVisible()
    expect(screen.queryByText('Total perdido en boxes')).not.toBeInTheDocument()
  })
})
