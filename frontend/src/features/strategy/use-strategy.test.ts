import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import type { RaceOverview } from '@/shared/api/types'
import { defaultStints, useStrategy } from './use-strategy'

function overviewWith(id: string, laps: number): RaceOverview {
  return { ...OVERVIEW, race: { ...OVERVIEW.race, id, laps } }
}

describe('defaultStints', () => {
  it('builds a one-stop Medium to Hard split at 45% of the race', () => {
    expect(defaultStints(53)).toEqual([
      { compound: 'MEDIUM', laps: 23 },
      { compound: 'HARD', laps: 30 },
    ])
    expect(defaultStints(78)).toEqual([
      { compound: 'MEDIUM', laps: 35 },
      { compound: 'HARD', laps: 43 },
    ])
  })

  it('always covers the whole race', () => {
    for (const laps of [2, 3, 44, 57, 71]) {
      const total = defaultStints(laps).reduce((sum, stint) => sum + stint.laps, 0)
      expect(total).toBe(laps)
    }
  })

  it('keeps the first stint at one lap or more', () => {
    expect(defaultStints(2)).toEqual([
      { compound: 'MEDIUM', laps: 1 },
      { compound: 'HARD', laps: 1 },
    ])
  })
})

describe('useStrategy', () => {
  it('preloads the default strategy and validates it clean', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    expect(result.current.stints).toEqual(defaultStints(53))
    expect(result.current.validation.errors).toEqual([])
  })

  it('edits laps and compound of a single stint and revalidates', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.setLaps(0, 20))
    act(() => result.current.setCompound(1, 'SOFT'))

    expect(result.current.stints).toEqual([
      { compound: 'MEDIUM', laps: 20 },
      { compound: 'SOFT', laps: 30 },
    ])
    expect(result.current.validation.errors.map((error) => error.code)).toEqual(['LAPS_MISMATCH'])
  })

  it('reports rain warnings from the overview forecast and tyres', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.setLaps(0, 30))
    act(() => result.current.setLaps(1, 23))
    act(() => result.current.setCompound(1, 'SOFT'))

    expect(result.current.validation.errors).toEqual([])
    expect(result.current.validation.warnings).toEqual([
      expect.objectContaining({ stintIndex: 1, compound: 'SOFT', fromLap: 31, toLap: 53 }),
    ])
  })

  it('adds a stint by taking half of the last one so the total is preserved', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.addStint())

    expect(result.current.stints).toEqual([
      { compound: 'MEDIUM', laps: 23 },
      { compound: 'HARD', laps: 15 },
      { compound: 'MEDIUM', laps: 15 },
    ])
  })

  it('adds an empty stint when the last one cannot be split', () => {
    const { result } = renderHook(() => useStrategy(overviewWith('tiny', 2)))

    act(() => result.current.setLaps(1, 1))
    act(() => result.current.addStint())

    expect(result.current.stints.at(-1)).toEqual({ compound: 'MEDIUM', laps: 0 })
    expect(result.current.stints.at(-2)?.laps).toBe(1)
  })

  it('removes a stint but never the last remaining one', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.removeStint(0))
    expect(result.current.stints).toEqual([{ compound: 'HARD', laps: 30 }])

    act(() => result.current.removeStint(0))
    expect(result.current.stints).toHaveLength(1)
  })

  it('resets to the new default when the race changes', () => {
    const { result, rerender } = renderHook(({ overview }) => useStrategy(overview), {
      initialProps: { overview: OVERVIEW },
    })

    act(() => result.current.setLaps(0, 10))
    rerender({ overview: overviewWith('monaco-gp', 78) })

    expect(result.current.stints).toEqual(defaultStints(78))
  })

  it('keeps the edits while the same race is re-rendered with fresh data', () => {
    const { result, rerender } = renderHook(({ overview }) => useStrategy(overview), {
      initialProps: { overview: OVERVIEW },
    })

    act(() => result.current.setLaps(0, 10))
    rerender({ overview: { ...OVERVIEW } })

    expect(result.current.stints[0]?.laps).toBe(10)
  })
})
