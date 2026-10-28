import { describe, expect, it } from 'vitest'
import type { Tyre } from '@/shared/api/types'
import { fitsAnySegment, idealCompounds, rainMarks } from './ideal-compounds'

function tyre(compound: Tyre['compound'], min: number, max: number): Tyre {
  return {
    compound,
    pace: 0,
    degradation: 0.05,
    wetPerformance: 0.5,
    optimalRainIntensity: { min, max },
  }
}

const TYRES = [
  tyre('WET', 0.6, 1),
  tyre('INTERMEDIATE', 0.2, 0.7),
  tyre('HARD', 0, 0.1),
  tyre('SOFT', 0, 0.05),
]

describe('idealCompounds', () => {
  it('returns the compounds whose band contains the intensity, in compound order', () => {
    expect(idealCompounds(TYRES, 0)).toEqual(['SOFT', 'HARD'])
    expect(idealCompounds(TYRES, 0.35)).toEqual(['INTERMEDIATE'])
    expect(idealCompounds(TYRES, 0.65)).toEqual(['INTERMEDIATE', 'WET'])
  })

  it('includes both band edges and may return nothing', () => {
    expect(idealCompounds(TYRES, 0.05)).toEqual(['SOFT', 'HARD'])
    expect(idealCompounds(TYRES, 0.1)).toEqual(['HARD'])
    expect(idealCompounds(TYRES, 0.15)).toEqual([])
  })
})

describe('fitsAnySegment', () => {
  const forecast = [
    { fromLap: 1, toLap: 20, temperature: 20, rainIntensity: 0 },
    { fromLap: 21, toLap: 40, temperature: 20, rainIntensity: 0.35 },
  ]

  it('is true when one segment falls inside the band', () => {
    expect(fitsAnySegment(tyre('SOFT', 0, 0.05), forecast)).toBe(true)
    expect(fitsAnySegment(tyre('INTERMEDIATE', 0.2, 0.7), forecast)).toBe(true)
  })

  it('is false when no segment falls inside the band', () => {
    expect(fitsAnySegment(tyre('WET', 0.6, 1), forecast)).toBe(false)
  })
})

describe('rainMarks', () => {
  it('keeps the first occurrence of each distinct intensity', () => {
    expect(
      rainMarks([
        { fromLap: 1, toLap: 10, temperature: 20, rainIntensity: 0 },
        { fromLap: 11, toLap: 20, temperature: 20, rainIntensity: 0.35 },
        { fromLap: 21, toLap: 30, temperature: 20, rainIntensity: 0 },
      ]),
    ).toEqual([0, 0.35])
  })
})
