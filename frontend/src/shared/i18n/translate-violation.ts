import type { TFunction } from 'i18next'
import type { StrategyViolation } from '@/shared/api/types'

function finite(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function lapsDifference(params: Record<string, unknown>): number | undefined {
  const difference = finite(params.difference)
  if (difference !== undefined) return difference
  const expected = finite(params.expected)
  const actual = finite(params.actual)
  if (expected === undefined || actual === undefined) return undefined
  return expected - actual
}

function optionsFor(violation: StrategyViolation): Record<string, unknown> | null {
  const { code, params } = violation
  if (code === 'LAPS_MISMATCH') {
    const difference = lapsDifference(params)
    if (difference === undefined) return null
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
  const options = optionsFor(violation)
  if (options === null) return violation.message
  return t(`violations.${violation.code}`, {
    ...options,
    defaultValue: violation.message,
  })
}
