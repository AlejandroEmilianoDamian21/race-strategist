import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import type { StrategyViolation } from '@/shared/api/types'
import { translateViolation } from './translate-violation'

const pitStops: StrategyViolation = {
  code: 'NOT_ENOUGH_PIT_STOPS',
  field: 'stints',
  params: { required: 2, actual: 1 },
  message: 'raw backend message',
}

const missingLaps: StrategyViolation = {
  code: 'LAPS_MISMATCH',
  field: 'stints',
  params: { expected: 53, actual: 51, difference: 2 },
  message: 'raw backend message',
}

describe('translateViolation', () => {
  it('translates NOT_ENOUGH_PIT_STOPS to Spanish', () => {
    expect(translateViolation(i18n.t, pitStops)).toBe(
      'Hace falta al menos 2 paradas y la estrategia tiene 1.',
    )
  })

  it('translates LAPS_MISMATCH to Spanish', () => {
    expect(translateViolation(i18n.t, missingLaps)).toBe(
      'Los stints suman 51 vueltas y la carrera tiene 53. Faltan 2 vueltas.',
    )
  })

  it('translates to English', async () => {
    await i18n.changeLanguage('en')
    expect(translateViolation(i18n.t, pitStops)).toBe(
      'At least 2 pit stops are required but the strategy has 1.',
    )
    expect(translateViolation(i18n.t, missingLaps)).toBe(
      'Stints add up to 51 laps but the race has 53. 2 laps are missing.',
    )
  })

  it('handles extra laps and singular forms', () => {
    const extra: StrategyViolation = {
      ...missingLaps,
      params: { expected: 53, actual: 54, difference: -1 },
    }
    expect(translateViolation(i18n.t, extra)).toBe(
      'Los stints suman 54 vueltas y la carrera tiene 53. Sobra 1 vuelta.',
    )
    const single: StrategyViolation = {
      ...pitStops,
      params: { required: 1, actual: 0 },
    }
    expect(translateViolation(i18n.t, single)).toBe(
      'Hace falta al menos 1 parada y la estrategia tiene 0.',
    )
  })

  it('translates the remaining codes', () => {
    expect(
      translateViolation(i18n.t, {
        code: 'NO_STINTS',
        field: 'stints',
        params: {},
        message: 'm',
      }),
    ).toBe('La estrategia necesita al menos un stint.')
    expect(
      translateViolation(i18n.t, {
        code: 'STINT_TOO_SHORT',
        field: 'stints[1].laps',
        params: { stint: 2, laps: 0 },
        message: 'm',
      }),
    ).toBe('El stint 2 tiene 0 vueltas. Cada stint necesita al menos 1 vuelta entera.')
    expect(
      translateViolation(i18n.t, {
        code: 'UNKNOWN_COMPOUND',
        field: 'stints[2].compound',
        params: { stint: 3, compound: 'SUPERSOFT', allowed: 'SOFT, MEDIUM' },
        message: 'm',
      }),
    ).toBe('El stint 3 usa "SUPERSOFT", que no es un compuesto válido. Opciones: SOFT, MEDIUM.')
  })

  it('falls back to the backend message for unknown codes', () => {
    const unknown = {
      code: 'SOMETHING_NEW',
      params: {},
      message: 'raw',
    } as unknown as StrategyViolation
    expect(translateViolation(i18n.t, unknown)).toBe('raw')
  })
})
