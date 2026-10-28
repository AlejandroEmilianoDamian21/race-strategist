import { describe, expect, it } from 'vitest'
import { breakdownRows, breakdownTotals, hasRainLoss } from './breakdown'
import { buildResult, NO_STOP, TWO_STOPS } from './result-fixtures'

describe('breakdownRows', () => {
  it('puts each pit stop right after the stint it closes', () => {
    const rows = breakdownRows(buildResult(TWO_STOPS))
    expect(rows.map((row) => row.kind)).toEqual(['stint', 'pit', 'stint', 'pit', 'stint'])
    const pits = rows.filter((row) => row.kind === 'pit')
    expect(pits.map((row) => row.stop.lap)).toEqual([4, 7])
  })

  it('has no pit row for a strategy without stops', () => {
    expect(breakdownRows(buildResult(NO_STOP)).map((row) => row.kind)).toEqual(['stint'])
  })
})

describe('breakdownTotals', () => {
  it('totals laps and time', () => {
    const result = buildResult(TWO_STOPS)
    expect(breakdownTotals(result)).toEqual({ laps: 10, time: result.totalTime })
  })
})

describe('hasRainLoss', () => {
  it('shows rain loss only above one second', () => {
    expect(hasRainLoss(1)).toBe(false)
    expect(hasRainLoss(1.01)).toBe(true)
    expect(hasRainLoss(0)).toBe(false)
  })
})
