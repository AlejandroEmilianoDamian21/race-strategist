import { describe, expect, it } from 'vitest'
import type { Stint } from '@/shared/api/types'
import { lapAtPointer, movePit, stintEnds } from './pit-lap'

const THREE: Stint[] = [
  { compound: 'MEDIUM', laps: 26 },
  { compound: 'INTERMEDIATE', laps: 20 },
  { compound: 'WET', laps: 24 },
]

describe('stintEnds', () => {
  it('returns the cumulative last lap of each stint', () => {
    expect(stintEnds(THREE)).toEqual([26, 46, 70])
  })

  it('treats invalid lap counts as zero', () => {
    expect(
      stintEnds([
        { compound: 'MEDIUM', laps: Number.NaN },
        { compound: 'HARD', laps: -4 },
        { compound: 'HARD', laps: 10 },
      ]),
    ).toEqual([0, 0, 10])
  })
})

describe('movePit', () => {
  it('moves laps from the next stint to this one, keeping the total', () => {
    expect(movePit(THREE, 0, 30)).toEqual([
      { compound: 'MEDIUM', laps: 30 },
      { compound: 'INTERMEDIATE', laps: 16 },
      { compound: 'WET', laps: 24 },
    ])
  })

  it('moves laps from this stint to the next one', () => {
    expect(movePit(THREE, 1, 40)).toEqual([
      { compound: 'MEDIUM', laps: 26 },
      { compound: 'INTERMEDIATE', laps: 14 },
      { compound: 'WET', laps: 30 },
    ])
  })

  it('keeps at least one lap in each of the two stints', () => {
    expect(movePit(THREE, 0, 0).map((stint) => stint.laps)).toEqual([1, 45, 24])
    expect(movePit(THREE, 0, 99).map((stint) => stint.laps)).toEqual([45, 1, 24])
  })

  it('rounds to a whole lap', () => {
    expect(movePit(THREE, 0, 29.6).map((stint) => stint.laps)).toEqual([30, 16, 24])
  })

  it('does not mutate the input and leaves it alone for the last stint or no room', () => {
    const before = JSON.stringify(THREE)
    movePit(THREE, 0, 30)
    expect(JSON.stringify(THREE)).toBe(before)
    expect(movePit(THREE, 2, 30)).toEqual(THREE)
    expect(
      movePit(
        [
          { compound: 'MEDIUM', laps: 1 },
          { compound: 'HARD', laps: 0 },
        ],
        0,
        1,
      ),
    ).toEqual([
      { compound: 'MEDIUM', laps: 1 },
      { compound: 'HARD', laps: 0 },
    ])
  })
})

describe('lapAtPointer', () => {
  it('maps the pointer position over the bar to a lap of the race', () => {
    expect(lapAtPointer(300, 100, 400, 70)).toBe(35)
    expect(lapAtPointer(100, 100, 400, 70)).toBe(0)
    expect(lapAtPointer(500, 100, 400, 70)).toBe(70)
  })

  it('returns 0 for a bar without width', () => {
    expect(lapAtPointer(300, 100, 0, 70)).toBe(0)
  })
})
