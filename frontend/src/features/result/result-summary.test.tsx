import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import { ResultSummary } from './result-summary'
import { buildResult, NO_STOP, ONE_STOP, TWO_STOPS } from './result-fixtures'

describe('ResultSummary', () => {
  it('shows the driver and race chip', () => {
    render(<ResultSummary result={buildResult(TWO_STOPS)} previous={null} overview={OVERVIEW} />)

    expect(screen.getByText('#16 Charles Leclerc · Italian Grand Prix')).toBeVisible()
  })

  it('shows the stops, the compound line and the sentence', () => {
    render(<ResultSummary result={buildResult(TWO_STOPS)} previous={null} overview={OVERVIEW} />)

    const line = screen.getAllByText('2 paradas')[0]!.parentElement!
    expect(within(line).getByText('Medio')).toBeVisible()
    expect(within(line).getByText('Intermedio')).toBeVisible()
    expect(within(line).getByText('Lluvia')).toBeVisible()
    expect(within(line).getAllByText('→')).toHaveLength(2)
    expect(
      screen.getByText(
        'Parás en la V4 y la V7. El stint más largo es con Medio (4 vueltas). Perdés 4.5s por usar compuestos fuera de su banda de lluvia.',
      ),
    ).toBeVisible()
  })

  it('says there were no stops and that every compound ran in its band', () => {
    render(<ResultSummary result={buildResult(NO_STOP)} previous={null} overview={OVERVIEW} />)

    expect(screen.getAllByText('Sin paradas')[0]).toBeVisible()
    expect(
      screen.getByText(
        'Sin paradas. El stint más largo es con Duro (5 vueltas). Cada compuesto corre dentro de su banda de lluvia.',
      ),
    ).toBeVisible()
  })

  it('shows the total time as the hero and the three KPIs', () => {
    const result = buildResult(TWO_STOPS)
    render(<ResultSummary result={result} previous={null} overview={OVERVIEW} />)

    expect(screen.getByText('Tiempo total estimado')).toBeVisible()
    expect(screen.getByText('0:14:00.700')).toHaveClass('time-hero')
    expect(screen.getByText('Vuelta más rápida').parentElement).toHaveTextContent(
      'Vuelta más rápida1:18.000V5 · Intermedio',
    )
    expect(screen.getByText('Perdido en boxes').parentElement).toHaveTextContent(
      'Perdido en boxes+44.0s2 paradas',
    )
    expect(screen.getByText('Promedio / vuelta').parentElement).toHaveTextContent(
      'Promedio / vuelta1:24.07010 vueltas',
    )
  })

  it('shows no delta without a previous result', () => {
    render(<ResultSummary result={buildResult(TWO_STOPS)} previous={null} overview={OVERVIEW} />)

    expect(screen.queryByText(/vs\. anterior/)).not.toBeInTheDocument()
  })

  it('shows an improvement in success with a down arrow and the minus sign', () => {
    const result = buildResult(TWO_STOPS)
    const previous = { ...buildResult(ONE_STOP), totalTime: result.totalTime + 12.34 }
    render(<ResultSummary result={result} previous={previous} overview={OVERVIEW} />)

    const delta = screen.getByText('−12.3s vs. anterior')
    expect(delta).toHaveClass('text-success')
    expect(delta.querySelector('svg')).not.toBeNull()
    expect(delta).toHaveAttribute('data-trend', 'better')
  })

  it('shows a loss in danger with a plus sign and m:ss.s above a minute', () => {
    const result = buildResult(TWO_STOPS)
    const previous = { ...buildResult(ONE_STOP), totalTime: result.totalTime - 149.2 }
    render(<ResultSummary result={result} previous={previous} overview={OVERVIEW} />)

    const delta = screen.getByText('+2:29.2 vs. anterior')
    expect(delta).toHaveClass('text-danger')
    expect(delta).toHaveAttribute('data-trend', 'worse')
  })

  it('treats a tie as an improvement', () => {
    const result = buildResult(TWO_STOPS)
    render(<ResultSummary result={result} previous={{ ...result }} overview={OVERVIEW} />)

    expect(screen.getByText('±0.0s vs. anterior')).toHaveClass('text-success')
  })

  it('explains how it was calculated with the real values of the race', () => {
    render(<ResultSummary result={buildResult(TWO_STOPS)} previous={null} overview={OVERVIEW} />)

    const details = screen.getByText('Cómo se calculó').closest('details')!
    expect(details).not.toHaveAttribute('open')
    expect(details).toHaveTextContent('baseLapTime 81.5s')
    expect(details).toHaveTextContent('tyreWear 0.9')
    expect(details).toHaveTextContent('fuelEffectPerLap 0.03s × vuelta')
    expect(details).toHaveTextContent('+0.30s/vuelta')
    expect(details).toHaveTextContent('carPerformance 0.95')
    expect(details).toHaveTextContent('pace 0.97')
    expect(details).toHaveTextContent('pitStopLoss 19.5s + tyreChangeTime 2.5s')
    expect(details).toHaveTextContent('safety car (25% de probabilidad)')
    expect(details).toHaveTextContent('lapTimeVariance 0.3s')
    expect(details).toHaveTextContent('overtakingDifficulty 0.4')
  })

  it('cuts the corner of the card', () => {
    const { container } = render(
      <ResultSummary result={buildResult(TWO_STOPS)} previous={null} overview={OVERVIEW} />,
    )

    expect(container.firstElementChild?.className).toContain('clip-path')
  })
})
