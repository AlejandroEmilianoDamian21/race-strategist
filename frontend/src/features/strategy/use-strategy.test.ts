import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import type { RaceOverview } from '@/shared/api/types'
import { defaultStints, useStrategy } from './use-strategy'

function overviewWith(id: string, laps: number): RaceOverview {
  return { ...OVERVIEW, race: { ...OVERVIEW.race, id, laps } }
}

describe('defaultStints', () => {
  it('builds a one-stop Medium to Hard split, the extra lap going to the Medium stint', () => {
    expect(defaultStints(53)).toEqual([
      { compound: 'MEDIUM', laps: 27 },
      { compound: 'HARD', laps: 26 },
    ])
    expect(defaultStints(70)).toEqual([
      { compound: 'MEDIUM', laps: 35 },
      { compound: 'HARD', laps: 35 },
    ])
  })

  it('always covers the whole race', () => {
    for (const laps of [2, 3, 44, 57, 71]) {
      const total = defaultStints(laps).reduce((sum, stint) => sum + stint.laps, 0)
      expect(total).toBe(laps)
    }
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
      { compound: 'SOFT', laps: 26 },
    ])
    expect(result.current.validation.errors.map((error) => error.code)).toEqual(['LAPS_MISMATCH'])
  })

  it('reports rain warnings from the overview forecast and tyres', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.movePit(0, 30))
    act(() => result.current.setCompound(1, 'SOFT'))

    expect(result.current.validation.errors).toEqual([])
    expect(result.current.validation.warnings).toEqual([
      expect.objectContaining({ stintIndex: 1, compound: 'SOFT', fromLap: 31, toLap: 53 }),
    ])
  })

  it('adds a stop by splitting the longest stint with the ideal compound', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.addStop())

    expect(result.current.stints).toEqual([
      { compound: 'MEDIUM', laps: 14 },
      { compound: 'SOFT', laps: 13 },
      { compound: 'HARD', laps: 26 },
    ])
  })

  it('does not add a stop when the longest stint has a single lap', () => {
    const { result } = renderHook(() => useStrategy(overviewWith('tiny', 2)))

    act(() => result.current.addStop())

    expect(result.current.stints).toHaveLength(2)
  })

  it('removes a stint giving its laps to the previous one, never the last remaining', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.removeStint(1))
    expect(result.current.stints).toEqual([{ compound: 'MEDIUM', laps: 53 }])

    act(() => result.current.removeStint(0))
    expect(result.current.stints).toHaveLength(1)
  })

  it('moves a pit stop keeping the total and clamping between its neighbours', () => {
    const { result } = renderHook(() => useStrategy(OVERVIEW))

    act(() => result.current.movePit(0, 30))
    expect(result.current.stints.map((stint) => stint.laps)).toEqual([30, 23])

    act(() => result.current.movePit(0, 99))
    expect(result.current.stints.map((stint) => stint.laps)).toEqual([52, 1])
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
