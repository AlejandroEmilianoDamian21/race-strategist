import { describe, expect, it } from 'vitest'
import type { Stint, Tyre, WeatherSegment } from '@/shared/api/types'
import { removeStint, splitLongestStint } from './stop-edits'

function tyre(compound: Tyre['compound'], min: number, max: number): Tyre {
  return {
    compound,
    pace: 0,
    degradation: 0.05,
    wetPerformance: 0.5,
    optimalRainIntensity: { min, max },
  }
}

const TYRES: Tyre[] = [
  tyre('SOFT', 0, 0.05),
  tyre('MEDIUM', 0, 0.08),
  tyre('HARD', 0, 0.1),
  tyre('INTERMEDIATE', 0.1, 0.5),
  tyre('WET', 0.4, 1),
]

const DRY_THEN_RAIN: WeatherSegment[] = [
  { fromLap: 1, toLap: 30, temperature: 28, rainIntensity: 0 },
  { fromLap: 31, toLap: 53, temperature: 24, rainIntensity: 0.35 },
]

describe('splitLongestStint', () => {
  it('halves the first of the longest stints and keeps the total', () => {
    const result = splitLongestStint(
      [
        { compound: 'MEDIUM', laps: 27 },
        { compound: 'HARD', laps: 26 },
      ],
      [],
      TYRES,
    )

    expect(result).toEqual([
      { compound: 'MEDIUM', laps: 14 },
      { compound: 'SOFT', laps: 13 },
      { compound: 'HARD', laps: 26 },
    ])
  })

  it('proposes the ideal compound for the weather in the middle of the new stint', () => {
    const result = splitLongestStint(
      [
        { compound: 'MEDIUM', laps: 20 },
        { compound: 'HARD', laps: 33 },
      ],
      DRY_THEN_RAIN,
      TYRES,
    )

    expect(result).toEqual([
      { compound: 'MEDIUM', laps: 20 },
      { compound: 'HARD', laps: 17 },
      { compound: 'INTERMEDIATE', laps: 16 },
    ])
  })

  it('uses the last forecast segment for laps beyond the forecast', () => {
    const result = splitLongestStint(
      [{ compound: 'HARD', laps: 60 }],
      [{ fromLap: 1, toLap: 10, temperature: 20, rainIntensity: 0.35 }],
      TYRES,
    )

    expect(result.map((stint) => stint.compound)).toEqual(['HARD', 'INTERMEDIATE'])
  })

  it('never proposes the compound of the stint it splits', () => {
    const result = splitLongestStint([{ compound: 'SOFT', laps: 20 }], [], TYRES)

    expect(result.map((stint) => stint.compound)).toEqual(['SOFT', 'MEDIUM'])
  })

  it('falls back to Hard, or Medium after Hard, when no tyre is ideal', () => {
    expect(
      splitLongestStint([{ compound: 'MEDIUM', laps: 10 }], [], []).map((s) => s.compound),
    ).toEqual(['MEDIUM', 'HARD'])
    expect(
      splitLongestStint([{ compound: 'HARD', laps: 10 }], [], []).map((s) => s.compound),
    ).toEqual(['HARD', 'MEDIUM'])
  })

  it('leaves the strategy alone when the longest stint has a single lap', () => {
    const stints: Stint[] = [
      { compound: 'MEDIUM', laps: 1 },
      { compound: 'HARD', laps: 1 },
    ]

    expect(splitLongestStint(stints, [], TYRES)).toEqual(stints)
  })

  it('does not mutate its input', () => {
    const stints: Stint[] = [{ compound: 'MEDIUM', laps: 20 }]
    splitLongestStint(stints, [], TYRES)

    expect(stints).toEqual([{ compound: 'MEDIUM', laps: 20 }])
  })
})

describe('removeStint', () => {
  const THREE: Stint[] = [
    { compound: 'MEDIUM', laps: 20 },
    { compound: 'HARD', laps: 15 },
    { compound: 'SOFT', laps: 18 },
  ]

  it('gives the laps of the removed stint to the previous one', () => {
    expect(removeStint(THREE, 1)).toEqual([
      { compound: 'MEDIUM', laps: 35 },
      { compound: 'SOFT', laps: 18 },
    ])
  })

  it('gives the laps of the first stint to the one that becomes first', () => {
    expect(removeStint(THREE, 0)).toEqual([
      { compound: 'HARD', laps: 35 },
      { compound: 'SOFT', laps: 18 },
    ])
  })

  it('never removes the last remaining stint', () => {
    const single: Stint[] = [{ compound: 'HARD', laps: 53 }]

    expect(removeStint(single, 0)).toEqual(single)
  })

  it('treats invalid laps as zero', () => {
    expect(
      removeStint(
        [
          { compound: 'MEDIUM', laps: 20 },
          { compound: 'HARD', laps: Number.NaN },
        ],
        1,
      ),
    ).toEqual([{ compound: 'MEDIUM', laps: 20 }])
  })
})
