import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSimulationProgress } from './use-simulation-progress'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSimulationProgress', () => {
  it('is null while nothing is simulating', () => {
    const { result } = renderHook(() => useSimulationProgress(false, 53))
    expect(result.current).toBeNull()
  })

  it('starts at lap 0 and advances while simulating', () => {
    const { result } = renderHook(() => useSimulationProgress(true, 53))
    expect(result.current).toBe(0)
    act(() => vi.advanceTimersByTime(70))
    expect(result.current).toBeGreaterThan(0)
  })

  it('never reaches the last lap before the response arrives', () => {
    const { result } = renderHook(() => useSimulationProgress(true, 53))
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current).toBe(52)
  })

  it('resets when the simulation ends', () => {
    const { result, rerender } = renderHook(({ active }) => useSimulationProgress(active, 53), {
      initialProps: { active: true },
    })
    act(() => vi.advanceTimersByTime(300))
    rerender({ active: false })
    expect(result.current).toBeNull()
    rerender({ active: true })
    expect(result.current).toBe(0)
  })
})
