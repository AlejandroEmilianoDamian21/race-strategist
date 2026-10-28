import { describe, expect, it } from 'vitest'
import { toPercent } from './to-percent'

describe('toPercent', () => {
  it('computes the ratio as a percentage', () => {
    expect(toPercent(25, 100)).toBe(25)
    expect(toPercent(1, 4)).toBe(25)
  })

  it('clamps values over the maximum to 100', () => {
    expect(toPercent(150, 100)).toBe(100)
    expect(toPercent(Infinity, 100)).toBe(100)
  })

  it('maps NaN and negative values to 0', () => {
    expect(toPercent(NaN, 100)).toBe(0)
    expect(toPercent(-5, 100)).toBe(0)
    expect(toPercent(-Infinity, 100)).toBe(0)
  })

  it('maps 0 over 0 to 0 and positive over 0 to 100', () => {
    expect(toPercent(0, 0)).toBe(0)
    expect(toPercent(5, 0)).toBe(100)
  })

  it('maps a NaN maximum to 0', () => {
    expect(toPercent(5, NaN)).toBe(0)
  })
})
