import { describe, expect, it } from 'vitest'
import { buildResult, NO_STOP, ONE_STOP, TWO_STOPS } from './result-fixtures'
import { summarize } from './summary'

describe('summarize', () => {
  const result = buildResult(TWO_STOPS)

  it('counts stops and lists the compounds in order', () => {
    const summary = summarize(result, null)
    expect(summary.stops).toBe(2)
    expect(summary.compounds).toEqual(['MEDIUM', 'INTERMEDIATE', 'WET'])
    expect(summary.pitLaps).toEqual([4, 7])
    expect(summary.totalLaps).toBe(10)
  })

  it('finds the longest stint, keeping the first on ties', () => {
    expect(summarize(result, null).longest).toEqual({ compound: 'MEDIUM', laps: 4 })
    expect(
      summarize(
        buildResult([
          { compound: 'SOFT', laps: 3, base: 80 },
          { compound: 'HARD', laps: 3, base: 80 },
        ]),
        null,
      ).longest.compound,
    ).toBe('SOFT')
  })

  it('adds the rain loss of every stint', () => {
    expect(summarize(result, null).wetLoss).toBeCloseTo(4.5)
  })

  it('sums the pit loss and finds the fastest lap without a pit stop', () => {
    const summary = summarize(result, null)
    expect(summary.pitLossTotal).toBe(44)
    expect(summary.bestLap).toEqual({ lap: 5, compound: 'INTERMEDIATE', time: 78 })
  })

  it('averages the total time over the laps', () => {
    const summary = summarize(result, null)
    expect(summary.averageLap).toBeCloseTo(result.totalTime / 10)
  })

  it('has no delta without a previous result and signs it against one', () => {
    expect(summarize(result, null).delta).toBeNull()
    const previous = buildResult(ONE_STOP)
    expect(summarize(result, previous).delta).toBeCloseTo(result.totalTime - previous.totalTime)
  })

  it('handles a strategy without stops', () => {
    const summary = summarize(buildResult(NO_STOP), null)
    expect(summary.stops).toBe(0)
    expect(summary.pitLossTotal).toBe(0)
    expect(summary.pitLaps).toEqual([])
    expect(summary.bestLap.lap).toBe(1)
  })
})
