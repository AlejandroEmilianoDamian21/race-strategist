import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRaceSelection } from './use-race-selection'

describe('useRaceSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRaceSelection())

    expect(result.current.raceId).toBeNull()
    expect(result.current.driverId).toBeNull()
  })

  it('resets the driver when a different race is selected', () => {
    const { result } = renderHook(() => useRaceSelection())

    act(() => result.current.selectRace('a'))
    act(() => result.current.selectDriver('leclerc'))
    expect(result.current.driverId).toBe('leclerc')

    act(() => result.current.selectRace('b'))
    expect(result.current.raceId).toBe('b')
    expect(result.current.driverId).toBeNull()
  })

  it('keeps the driver when the same race is selected again', () => {
    const { result } = renderHook(() => useRaceSelection())

    act(() => result.current.selectRace('a'))
    act(() => result.current.selectDriver('leclerc'))
    act(() => result.current.selectRace('a'))

    expect(result.current.driverId).toBe('leclerc')
  })
})
