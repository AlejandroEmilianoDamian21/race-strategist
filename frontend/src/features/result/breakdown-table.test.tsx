import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BreakdownTable } from './breakdown-table'
import { buildResult, TWO_STOPS } from './result-fixtures'

describe('BreakdownTable', () => {
  const result = buildResult(TWO_STOPS)

  it('has the reference columns', () => {
    render(<BreakdownTable result={result} />)

    expect(screen.getByRole('heading', { name: 'Desglose por stint' })).toBeVisible()
    const headers = within(screen.getByRole('table')).getAllByRole('columnheader')
    expect(headers.map((header) => header.textContent)).toEqual([
      'Stint',
      'Compuesto',
      'Desde',
      'Hasta',
      'Vueltas',
      'Prom./vuelta',
      'Por lluvia',
      'Tiempo',
    ])
  })

  it('interleaves the pit stops between the stints', () => {
    render(<BreakdownTable result={result} />)

    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(1 + 5 + 1)
    expect(rows[1]).toHaveTextContent('Medio')
    expect(rows[1]).toHaveTextContent('V1')
    expect(rows[1]).toHaveTextContent('V4')
    expect(rows[2]).toHaveTextContent('Parada en boxes')
    expect(rows[2]).toHaveTextContent('V4')
    expect(rows[2]).toHaveTextContent('19.5 + 2.5')
    expect(rows[2]).toHaveTextContent('+22.0s')
    expect(rows[4]).toHaveTextContent('Parada en boxes')
  })

  it('shows the average lap, the rain loss only above a second and the stint time', () => {
    render(<BreakdownTable result={result} />)

    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('1:20.150')
    expect(rows[1]).toHaveTextContent('—')
    expect(rows[1]).toHaveTextContent('5:20.6')
    expect(rows[5]).toHaveTextContent('+4.5s')
  })

  it('totals the laps and the time in the footer', () => {
    render(<BreakdownTable result={result} />)

    const footer = within(screen.getByRole('table')).getAllByRole('row').at(-1)!
    expect(footer).toHaveTextContent('Total')
    expect(footer).toHaveTextContent('10')
    expect(footer).toHaveTextContent('0:14:00.700')
  })

  it('also renders the cards used on mobile', () => {
    render(<BreakdownTable result={result} />)

    expect(screen.getByText('Stint 1 · Medio')).toBeVisible()
    expect(screen.getByText('Parada en V4')).toBeVisible()
    expect(screen.getByText(/lluvia \+4.5s/)).toBeVisible()
  })
})
