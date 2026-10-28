import { describe, expect, it } from 'vitest'
import type { Stint, Tyre, WeatherSegment } from '@/shared/api/types'
import { validateStrategy } from './validate-strategy'

const TYRES: Tyre[] = [
  {
    compound: 'SOFT',
    pace: -1,
    degradation: 0.1,
    wetPerformance: 0.1,
    optimalRainIntensity: { min: 0, max: 0.05 },
  },
  {
    compound: 'MEDIUM',
    pace: 0,
    degradation: 0.07,
    wetPerformance: 0.15,
    optimalRainIntensity: { min: 0, max: 0.08 },
  },
  {
    compound: 'HARD',
    pace: 0.5,
    degradation: 0.04,
    wetPerformance: 0.2,
    optimalRainIntensity: { min: 0, max: 0.1 },
  },
  {
    compound: 'INTERMEDIATE',
    pace: 2,
    degradation: 0.05,
    wetPerformance: 0.6,
    optimalRainIntensity: { min: 0.1, max: 0.5 },
  },
  {
    compound: 'WET',
    pace: 4,
    degradation: 0.05,
    wetPerformance: 0.9,
    optimalRainIntensity: { min: 0.4, max: 1 },
  },
]

const DRY_THEN_RAIN: WeatherSegment[] = [
  { fromLap: 1, toLap: 30, temperature: 28, rainIntensity: 0 },
  { fromLap: 31, toLap: 53, temperature: 24, rainIntensity: 0.35 },
]

function validate(
  stints: Stint[],
  overrides: Partial<{
    raceLaps: number
    minimumPitStops: number
    forecast: WeatherSegment[]
    tyres: Tyre[]
  }> = {},
) {
  return validateStrategy(stints, {
    raceLaps: 53,
    minimumPitStops: 1,
    forecast: [],
    tyres: TYRES,
    ...overrides,
  })
}

describe('validateStrategy errors', () => {
  it('accepts a valid one-stop strategy', () => {
    const result = validate([
      { compound: 'MEDIUM', laps: 23 },
      { compound: 'HARD', laps: 30 },
    ])

    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('reports only NO_STINTS for an empty strategy', () => {
    expect(validate([]).errors).toEqual([
      {
        code: 'NO_STINTS',
        field: 'stints',
        params: {},
        message: 'The strategy needs at least one stint.',
      },
    ])
  })

  it('flags a stint with zero laps with the backend field and params', () => {
    const { errors } = validate([
      { compound: 'MEDIUM', laps: 0 },
      { compound: 'HARD', laps: 53 },
    ])

    expect(errors).toEqual([
      {
        code: 'STINT_TOO_SHORT',
        field: 'stints[0].laps',
        params: { stint: 1, laps: 0 },
        message: 'Stint 1 must have at least 1 whole lap (got 0).',
      },
    ])
  })

  it('flags negative, fractional and NaN laps', () => {
    const { errors } = validate([
      { compound: 'MEDIUM', laps: -2 },
      { compound: 'HARD', laps: 1.5 },
      { compound: 'SOFT', laps: Number.NaN },
    ])

    expect(errors.filter((error) => error.code === 'STINT_TOO_SHORT')).toEqual([
      expect.objectContaining({ field: 'stints[0].laps', params: { stint: 1, laps: -2 } }),
      expect.objectContaining({ field: 'stints[1].laps', params: { stint: 2, laps: 1.5 } }),
      expect.objectContaining({ field: 'stints[2].laps', params: { stint: 3, laps: Number.NaN } }),
    ])
  })

  it('flags an unknown compound listing the allowed ones', () => {
    const { errors } = validate([
      { compound: 'MEDIUM', laps: 23 },
      { compound: 'SLICK', laps: 30 },
    ])

    expect(errors).toEqual([
      {
        code: 'UNKNOWN_COMPOUND',
        field: 'stints[1].compound',
        params: { stint: 2, compound: 'SLICK', allowed: 'SOFT, MEDIUM, HARD, INTERMEDIATE, WET' },
        message:
          'Stint 2 uses unknown compound "SLICK". Allowed: SOFT, MEDIUM, HARD, INTERMEDIATE, WET.',
      },
    ])
  })

  it('is case sensitive like the backend', () => {
    const { errors } = validate([
      { compound: 'soft', laps: 23 },
      { compound: 'HARD', laps: 30 },
    ])

    expect(errors.map((error) => error.code)).toEqual(['UNKNOWN_COMPOUND'])
  })

  it('reports missing laps with expected, actual and difference', () => {
    const { errors } = validate([
      { compound: 'MEDIUM', laps: 23 },
      { compound: 'HARD', laps: 28 },
    ])

    expect(errors).toEqual([
      {
        code: 'LAPS_MISMATCH',
        field: 'stints',
        params: { expected: 53, actual: 51, difference: 2 },
        message: 'Stints add up to 51 laps but the race has 53.',
      },
    ])
  })

  it('reports extra laps with a negative difference', () => {
    const { errors } = validate([
      { compound: 'MEDIUM', laps: 30 },
      { compound: 'HARD', laps: 30 },
    ])

    expect(errors[0]).toMatchObject({
      code: 'LAPS_MISMATCH',
      params: { expected: 53, actual: 60, difference: -7 },
    })
  })

  it('counts pit stops as stints minus one', () => {
    const { errors } = validate([{ compound: 'MEDIUM', laps: 53 }], { minimumPitStops: 1 })

    expect(errors).toEqual([
      {
        code: 'NOT_ENOUGH_PIT_STOPS',
        field: 'stints',
        params: { required: 1, actual: 0 },
        message: 'At least 1 pit stop(s) required but the strategy has 0.',
      },
    ])
  })

  it('accepts exactly the minimum number of pit stops', () => {
    const { errors } = validate(
      [
        { compound: 'MEDIUM', laps: 20 },
        { compound: 'HARD', laps: 20 },
        { compound: 'SOFT', laps: 13 },
      ],
      { minimumPitStops: 2 },
    )

    expect(errors).toEqual([])
  })

  it('does not require stops when the minimum is zero', () => {
    expect(validate([{ compound: 'HARD', laps: 53 }], { minimumPitStops: 0 }).errors).toEqual([])
  })

  it('keeps the backend ordering: stint errors, then laps, then pit stops', () => {
    const { errors } = validate([{ compound: 'SLICK', laps: 0 }])

    expect(errors.map((error) => error.code)).toEqual([
      'STINT_TOO_SHORT',
      'UNKNOWN_COMPOUND',
      'LAPS_MISMATCH',
      'NOT_ENOUGH_PIT_STOPS',
    ])
  })
})

describe('validateStrategy rain warnings', () => {
  it('warns when a soft stint runs into rain above its band', () => {
    const { errors, warnings } = validate(
      [
        { compound: 'HARD', laps: 30 },
        { compound: 'SOFT', laps: 23 },
      ],
      { forecast: DRY_THEN_RAIN },
    )

    expect(errors).toEqual([])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({
      stintIndex: 1,
      compound: 'SOFT',
      fromLap: 31,
      toLap: 53,
      rainIntensity: 0.35,
      band: { min: 0, max: 0.05 },
      idealCompounds: ['INTERMEDIATE'],
    })
    expect(warnings[0]?.lossPerLap).toBeCloseTo(5.4, 10)
  })

  it('does not warn when the compound band covers the rain', () => {
    const { warnings } = validate(
      [
        { compound: 'HARD', laps: 30 },
        { compound: 'INTERMEDIATE', laps: 23 },
      ],
      { forecast: DRY_THEN_RAIN },
    )

    expect(warnings).toEqual([])
  })

  it('treats both band limits as inclusive', () => {
    const { warnings } = validate(
      [
        { compound: 'INTERMEDIATE', laps: 30 },
        { compound: 'INTERMEDIATE', laps: 23 },
      ],
      { forecast: [{ fromLap: 1, toLap: 53, temperature: 20, rainIntensity: 0.5 }] },
    )

    expect(warnings).toEqual([])
  })

  it('applies the below-band penalty of 6 per unit and lists every ideal compound', () => {
    const { warnings } = validate(
      [
        { compound: 'INTERMEDIATE', laps: 30 },
        { compound: 'HARD', laps: 23 },
      ],
      { forecast: [{ fromLap: 1, toLap: 53, temperature: 28, rainIntensity: 0 }] },
    )

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({
      stintIndex: 0,
      compound: 'INTERMEDIATE',
      fromLap: 1,
      toLap: 30,
      idealCompounds: ['SOFT', 'MEDIUM', 'HARD'],
    })
    expect(warnings[0]?.lossPerLap).toBeCloseTo(0.6, 10)
  })

  it('ignores losses of half a second per lap or less', () => {
    const { warnings } = validate(
      [
        { compound: 'WET', laps: 30 },
        { compound: 'INTERMEDIATE', laps: 23 },
      ],
      { forecast: [{ fromLap: 1, toLap: 53, temperature: 28, rainIntensity: 0.35 }] },
    )

    expect(warnings).toEqual([])
  })

  it('reports one warning per stint, for the segment with the worst loss', () => {
    const { warnings } = validate(
      [
        { compound: 'SOFT', laps: 40 },
        { compound: 'INTERMEDIATE', laps: 13 },
      ],
      {
        forecast: [
          { fromLap: 1, toLap: 10, temperature: 28, rainIntensity: 0 },
          { fromLap: 11, toLap: 25, temperature: 26, rainIntensity: 0.2 },
          { fromLap: 26, toLap: 53, temperature: 24, rainIntensity: 0.5 },
        ],
      },
    )

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ stintIndex: 0, fromLap: 26, toLap: 40, rainIntensity: 0.5 })
  })

  it('numbers lap ranges from the cumulative laps of previous stints', () => {
    const { warnings } = validate(
      [
        { compound: 'HARD', laps: 10 },
        { compound: 'MEDIUM', laps: 20 },
        { compound: 'SOFT', laps: 23 },
      ],
      { forecast: DRY_THEN_RAIN },
    )

    expect(warnings.map((warning) => [warning.stintIndex, warning.fromLap, warning.toLap])).toEqual(
      [[2, 31, 53]],
    )
  })

  it('ignores segments that do not overlap any stint lap', () => {
    const { warnings } = validate(
      [
        { compound: 'SOFT', laps: 20 },
        { compound: 'HARD', laps: 33 },
      ],
      { forecast: [{ fromLap: 54, toLap: 70, temperature: 20, rainIntensity: 0.35 }] },
    )

    expect(warnings).toEqual([])
  })

  it('skips stints with invalid laps without shifting the following ones', () => {
    const { warnings } = validate(
      [
        { compound: 'HARD', laps: 30 },
        { compound: 'MEDIUM', laps: Number.NaN },
        { compound: 'SOFT', laps: 23 },
      ],
      { forecast: DRY_THEN_RAIN },
    )

    expect(warnings.map((warning) => [warning.stintIndex, warning.fromLap, warning.toLap])).toEqual(
      [[2, 31, 53]],
    )
  })

  it('skips unknown compounds and compounds missing from the tyre list', () => {
    const forecast = DRY_THEN_RAIN
    const stints = [
      { compound: 'HARD', laps: 30 },
      { compound: 'SLICK', laps: 23 },
    ]

    expect(validate(stints, { forecast }).warnings).toEqual([])
    expect(
      validate(
        [
          { compound: 'HARD', laps: 30 },
          { compound: 'SOFT', laps: 23 },
        ],
        { forecast, tyres: TYRES.filter((tyre) => tyre.compound !== 'SOFT') },
      ).warnings,
    ).toEqual([])
  })

  it('still reports warnings while the strategy has errors', () => {
    const { errors, warnings } = validate(
      [
        { compound: 'HARD', laps: 30 },
        { compound: 'SOFT', laps: 20 },
      ],
      { forecast: DRY_THEN_RAIN },
    )

    expect(errors.map((error) => error.code)).toEqual(['LAPS_MISMATCH'])
    expect(warnings).toHaveLength(1)
  })
})
