import { describe, expect, it } from 'vitest'
import type { StrategyViolation } from '@/shared/api/types'
import { errorScopes } from './stint-scope'

function violation(
  code: StrategyViolation['code'],
  field: string,
  params: StrategyViolation['params'] = {},
): StrategyViolation {
  return { code, field, params, message: code }
}

describe('errorScopes', () => {
  it('marks the segment and the row of the stint with a stint error', () => {
    const scopes = errorScopes([violation('STINT_TOO_SHORT', 'stints[1].laps')], 3)

    expect([...scopes.segments]).toEqual([1])
    expect([...scopes.rows]).toEqual([1])
  })

  it('marks the stint with a missing compound', () => {
    const scopes = errorScopes([violation('UNKNOWN_COMPOUND', 'stints[2].compound')], 3)

    expect([...scopes.segments]).toEqual([2])
    expect([...scopes.rows]).toEqual([2])
  })

  it('marks only the last row when laps are missing, never a segment', () => {
    const scopes = errorScopes([violation('LAPS_MISMATCH', 'stints', { difference: 2 })], 3)

    expect(scopes.segments.size).toBe(0)
    expect([...scopes.rows]).toEqual([2])
  })

  it('marks no stint when laps are extra or pit stops are missing', () => {
    const scopes = errorScopes(
      [
        violation('LAPS_MISMATCH', 'stints', { difference: -3 }),
        violation('NOT_ENOUGH_PIT_STOPS', 'stints', { required: 2, actual: 1 }),
      ],
      3,
    )

    expect(scopes.segments.size).toBe(0)
    expect(scopes.rows.size).toBe(0)
  })

  it('has no scope without errors', () => {
    const scopes = errorScopes([], 2)

    expect(scopes.segments.size).toBe(0)
    expect(scopes.rows.size).toBe(0)
  })
})
