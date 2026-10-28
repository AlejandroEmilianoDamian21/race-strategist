import { describe, expect, it } from 'vitest'
import { formatLapTime, formatPercent, formatRaceDate, rainLevel } from './format'

describe('format helpers', () => {
  it('formats an ISO date as DD MON YYYY with an uppercase month', () => {
    expect(formatRaceDate('2025-06-15', 'es')).toBe('15 JUN 2025')
    expect(formatRaceDate('2025-09-06', 'es')).toBe('06 SEP 2025')
    expect(formatRaceDate('2025-04-13T00:00:00.000Z', 'es')).toBe('13 ABR 2025')
    expect(formatRaceDate('2025-01-05', 'es')).toBe('05 ENE 2025')
    expect(formatRaceDate('2025-12-07', 'es')).toBe('07 DIC 2025')
  })

  it('uses English month abbreviations for English', () => {
    expect(formatRaceDate('2025-04-13', 'en')).toBe('13 APR 2025')
    expect(formatRaceDate('2025-08-31', 'en-US')).toBe('31 AUG 2025')
  })

  it('formats lap times as m:ss.mmm', () => {
    expect(formatLapTime(81.5)).toBe('1:21.500')
    expect(formatLapTime(59.04)).toBe('0:59.040')
  })

  it('formats a 0-1 fraction as a rounded percentage', () => {
    expect(formatPercent(0.1)).toBe('10%')
    expect(formatPercent(0.255)).toBe('26%')
  })
})

describe('rainLevel', () => {
  it.each([
    [0, 'dry'],
    [-0.1, 'dry'],
    [0.01, 'drizzle'],
    [0.14, 'drizzle'],
    [0.15, 'moderate'],
    [0.35, 'moderate'],
    [0.54, 'moderate'],
    [0.55, 'heavy'],
    [1, 'heavy'],
  ])('maps a rain intensity of %s to "%s"', (intensity, level) => {
    expect(rainLevel(intensity)).toBe(level)
  })
})
