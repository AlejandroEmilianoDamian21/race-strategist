import { describe, expect, it } from 'vitest'
import {
  CHART,
  chartScale,
  lapAtX,
  lapXTicks,
  linePath,
  plotX,
  plotY,
  rainBands,
  stintBands,
  yTicks,
} from './lap-chart'
import { buildResult, ONE_STOP, TWO_STOPS } from './result-fixtures'

const result = buildResult(TWO_STOPS)

describe('chartScale', () => {
  it('fits the clean laps and ignores pit laps', () => {
    const scale = chartScale(result, null)
    expect(scale.lo).toBe(77)
    expect(scale.hi).toBe(82)
    expect(scale.step).toBe(1)
    expect(scale.cap).toBeCloseTo(82 + 0.9)
  })

  it('also fits the previous simulation', () => {
    const scale = chartScale(result, buildResult([{ compound: 'HARD', laps: 10, base: 90 }]))
    expect(scale.hi).toBeGreaterThanOrEqual(91)
    expect(scale.lo).toBe(77)
  })

  it('widens the step with the range', () => {
    expect(
      chartScale(
        buildResult([
          { compound: 'HARD', laps: 5, base: 70 },
          { compound: 'SOFT', laps: 5, base: 78 },
        ]),
        null,
      ).step,
    ).toBe(2)
    expect(
      chartScale(
        buildResult([
          { compound: 'HARD', laps: 5, base: 70 },
          { compound: 'SOFT', laps: 5, base: 90 },
        ]),
        null,
      ).step,
    ).toBe(4)
  })

  it('leaves headroom above the clean laps for the pit spikes', () => {
    const scale = chartScale(result, null)
    expect(scale.cap).toBeGreaterThan(scale.hi)
  })
})

describe('plot coordinates', () => {
  const scale = chartScale(result, null)

  it('maps laps to the plot width', () => {
    expect(plotX(1, 10)).toBe(CHART.ml)
    expect(plotX(10, 10)).toBe(CHART.W - CHART.mr)
  })

  it('maps times to the plot height and clips at the cap', () => {
    expect(plotY(scale.lo, scale)).toBeCloseTo(
      CHART.H -
        CHART.mb -
        ((scale.lo - scale.lo) / (scale.cap - scale.lo)) * (CHART.H - CHART.mt - CHART.mb),
    )
    expect(plotY(500, scale)).toBe(plotY(scale.cap, scale))
    expect(plotY(scale.cap, scale)).toBe(CHART.mt)
  })

  it('survives a single lap', () => {
    expect(plotX(1, 1)).toBe(CHART.ml)
  })

  it('finds the lap under an x coordinate', () => {
    expect(lapAtX(plotX(4, 10), 10)).toBe(4)
    expect(lapAtX(-100, 10)).toBe(1)
    expect(lapAtX(5000, 10)).toBe(10)
  })
})

describe('linePath', () => {
  it('draws one point per lap with the pit spike clipped to the cap', () => {
    const scale = chartScale(result, null)
    const path = linePath(result.laps, 10, scale)
    expect(path.startsWith('M')).toBe(true)
    expect(path.split('L')).toHaveLength(10)
    const spike = path.split('L')[3]!
    expect(spike).toBe(`${plotX(4, 10).toFixed(1)} ${CHART.mt.toFixed(1)}`)
  })
})

describe('bands', () => {
  it('splits the plot by stint at the midpoint between laps', () => {
    const bands = stintBands(result.stints, 10)
    expect(bands).toHaveLength(3)
    expect(bands[0]!.x0).toBe(CHART.ml)
    expect(bands[2]!.x1).toBe(CHART.W - CHART.mr)
    expect(bands[0]!.x1).toBeCloseTo((plotX(4, 10) + plotX(5, 10)) / 2)
    expect(bands[1]!.x0).toBe(bands[0]!.x1)
  })

  it('draws a rain strip only where it rains', () => {
    const strips = rainBands(
      [
        { fromLap: 1, toLap: 4, temperature: 20, rainIntensity: 0 },
        { fromLap: 5, toLap: 10, temperature: 20, rainIntensity: 0.35 },
      ],
      10,
    )
    expect(strips).toHaveLength(1)
    expect(strips[0]!.intensity).toBe(0.35)
    expect(strips[0]!.x1).toBe(CHART.W - CHART.mr)
  })
})

describe('ticks', () => {
  it('lists the y ticks from lo to hi', () => {
    const ticks = yTicks({ lo: 73, hi: 84, cap: 85, step: 2 })
    expect(ticks).toEqual([73, 75, 77, 79, 81, 83])
  })

  it('lists the lap ticks like the axis', () => {
    expect(lapXTicks(70)).toEqual([1, 10, 20, 30, 40, 50, 60, 70])
    expect(lapXTicks(10)).toEqual([1, 10])
    expect(lapXTicks(1)).toEqual([1])
  })
})

describe('single stop', () => {
  it('builds bands for a one stop strategy', () => {
    expect(stintBands(buildResult(ONE_STOP).stints, 10)).toHaveLength(2)
  })
})
