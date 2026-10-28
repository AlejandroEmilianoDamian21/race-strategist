import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StrategyChips } from './strategy-chips'

const BASE = {
  totalLaps: 53,
  raceLaps: 53,
  pitStopLoss: 19.5,
  tyreChangeTime: 2.5,
  minimumPitStops: 1,
  driver: null,
}

const DRIVER = {
  name: 'Charles Leclerc',
  teamName: 'Ferrari',
  carPerformance: 0.95,
  pace: 0.97,
}

describe('StrategyChips', () => {
  it('shows laps, pit cost and the minimum stops', () => {
    render(<StrategyChips {...BASE} />)

    expect(screen.getByText('Vueltas 53 / 53')).toBeVisible()
    expect(screen.getByText('Parada 19.5 + 2.5')).toBeVisible()
    expect(screen.getByText('Mínimo 1 parada')).toBeVisible()
  })

  it('pluralises the minimum stops', () => {
    render(<StrategyChips {...BASE} minimumPitStops={2} />)

    expect(screen.getByText('Mínimo 2 paradas')).toBeVisible()
  })

  it('flags a lap total that does not match the race', () => {
    render(<StrategyChips {...BASE} totalLaps={51} />)

    expect(screen.getByText('Vueltas 51 / 53')).toHaveAttribute('data-invalid', 'true')
  })

  it('does not flag a matching lap total', () => {
    render(<StrategyChips {...BASE} />)

    expect(screen.getByText('Vueltas 53 / 53')).not.toHaveAttribute('data-invalid')
  })

  it('asks for a driver when none is selected', () => {
    render(<StrategyChips {...BASE} />)

    expect(screen.getByText('Elegí un piloto')).toBeVisible()
    expect(screen.queryByText(/Ritmo/)).not.toBeInTheDocument()
  })

  it('shows the selected driver, team, car performance and pace', () => {
    render(<StrategyChips {...BASE} driver={DRIVER} />)

    expect(screen.getByText('Charles Leclerc · Ferrari')).toBeVisible()
    expect(screen.getByText('Auto 0.95 · Ritmo 0.97')).toBeVisible()
    expect(screen.queryByText('Elegí un piloto')).not.toBeInTheDocument()
  })
})
