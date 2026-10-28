import { describe, expect, it } from 'vitest'
import {
  COMPOUNDS,
  TYRE_COMPOUNDS,
  compoundLetter,
  compoundNameKey,
  isTyreCompound,
} from './compounds'

describe('compounds domain', () => {
  it('lists the compounds ordered from softest to wettest', () => {
    expect(TYRE_COMPOUNDS).toEqual(['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'])
    expect(COMPOUNDS.map((compound) => compound.letter)).toEqual(['S', 'M', 'H', 'I', 'W'])
  })

  it('maps each compound to its letter and name key', () => {
    expect(compoundLetter('INTERMEDIATE')).toBe('I')
    expect(compoundLetter('WET')).toBe('W')
    expect(compoundNameKey('SOFT')).toBe('compounds.SOFT')
  })

  it('narrows known compounds only', () => {
    expect(isTyreCompound('HARD')).toBe(true)
    expect(isTyreCompound('SUPERSOFT')).toBe(false)
  })
})
