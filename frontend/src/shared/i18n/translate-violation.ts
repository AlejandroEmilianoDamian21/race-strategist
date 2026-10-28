import type { TFunction } from 'i18next'
import type { StrategyViolation } from '@/shared/api/types'

function optionsFor(violation: StrategyViolation): Record<string, unknown> {
  const { code, params } = violation
  if (code === 'LAPS_MISMATCH') {
    const difference = Number(params.difference)
    return {
      ...params,
      context: difference < 0 ? 'extra' : 'missing',
      count: Math.abs(difference),
    }
  }
  if (code === 'NOT_ENOUGH_PIT_STOPS') {
    return { ...params, count: Number(params.required) }
  }
  return { ...params }
}

export function translateViolation(t: TFunction, violation: StrategyViolation): string {
  return t(`violations.${violation.code}`, {
    ...optionsFor(violation),
    defaultValue: violation.message,
  })
}
