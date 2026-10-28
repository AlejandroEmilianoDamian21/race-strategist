import { describe, expect, it } from 'vitest'
import { circuitReading } from './circuit-reading'

const NEUTRAL = {
  tyreWear: 1,
  overtakingDifficulty: 0.5,
  rainProbability: 0.2,
  safetyCarProbability: 0.2,
}

describe('circuitReading', () => {
  it('falls back to the balanced sentence when no rule applies', () => {
    expect(circuitReading(NEUTRAL)).toEqual([{ key: 'balanced' }])
  })

  it.each([
    [1.2, 'highWear', '1.2'],
    [1.35, 'highWear', '1.35'],
    [0.9, 'lowWear', '0.9'],
    [0.8, 'lowWear', '0.8'],
  ])('reads a tyre wear of %s as %s', (tyreWear, key, value) => {
    expect(circuitReading({ ...NEUTRAL, tyreWear })).toEqual([{ key, value }])
  })

  it.each([1.19, 1, 0.91])('stays silent for a tyre wear of %s', (tyreWear) => {
    expect(circuitReading({ ...NEUTRAL, tyreWear })).toEqual([{ key: 'balanced' }])
  })

  it('flags overtaking from 0.8', () => {
    expect(circuitReading({ ...NEUTRAL, overtakingDifficulty: 0.8 })).toEqual([
      { key: 'hardOvertaking', value: '0.8' },
    ])
    expect(circuitReading({ ...NEUTRAL, overtakingDifficulty: 0.79 })).toEqual([
      { key: 'balanced' },
    ])
  })

  it('flags rain and safety car from 50% with a rounded percentage', () => {
    expect(circuitReading({ ...NEUTRAL, rainProbability: 0.5 })).toEqual([
      { key: 'rain', value: '50%' },
    ])
    expect(circuitReading({ ...NEUTRAL, safetyCarProbability: 0.7 })).toEqual([
      { key: 'safetyCar', value: '70%' },
    ])
    expect(
      circuitReading({ ...NEUTRAL, rainProbability: 0.49, safetyCarProbability: 0.49 }),
    ).toEqual([{ key: 'balanced' }])
  })

  it('lists every applicable rule in the reference order', () => {
    expect(
      circuitReading({
        tyreWear: 1.3,
        overtakingDifficulty: 0.9,
        rainProbability: 0.65,
        safetyCarProbability: 0.6,
      }).map((item) => item.key),
    ).toEqual(['highWear', 'hardOvertaking', 'rain', 'safetyCar'])
  })
})
