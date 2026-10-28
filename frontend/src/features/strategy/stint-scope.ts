import type { StrategyViolation } from '@/shared/api/types'

export interface ErrorScopes {
  segments: Set<number>
  rows: Set<number>
}

export function errorScopes(errors: StrategyViolation[], stintCount: number): ErrorScopes {
  const segments = new Set<number>()
  const rows = new Set<number>()

  errors.forEach((error) => {
    const match = /^stints\[(\d+)\]/.exec(error.field ?? '')
    if (match !== null) {
      segments.add(Number(match[1]))
      rows.add(Number(match[1]))
      return
    }
    if (error.code === 'LAPS_MISMATCH' && Number(error.params.difference) > 0 && stintCount > 0) {
      rows.add(stintCount - 1)
    }
  })

  return { segments, rows }
}
