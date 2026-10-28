import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatElapsed, useWakeState } from './use-wake-state'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useWakeState', () => {
  it('stays idle while not pending', () => {
    const { result } = renderHook(() => useWakeState(false))

    expect(result.current).toEqual({ state: 'idle', elapsedSeconds: 0 })
  })

  it('goes idle -> waking at 3s -> timed-out at 90s', () => {
    const { result } = renderHook(() => useWakeState(true))
    expect(result.current.state).toBe('idle')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.state).toBe('idle')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.state).toBe('waking')
    expect(result.current.elapsedSeconds).toBe(3)

    act(() => {
      vi.advanceTimersByTime(86000)
    })
    expect(result.current.state).toBe('waking')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.state).toBe('timed-out')
    expect(result.current.elapsedSeconds).toBe(90)
  })

  it('resets to idle when the query settles', () => {
    const { result, rerender } = renderHook(({ pending }) => useWakeState(pending), {
      initialProps: { pending: true },
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.state).toBe('waking')

    rerender({ pending: false })
    expect(result.current).toEqual({ state: 'idle', elapsedSeconds: 0 })
  })
})

describe('formatElapsed', () => {
  it('formats seconds as m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(23)).toBe('0:23')
    expect(formatElapsed(65)).toBe('1:05')
  })
})
