import { describe, expect, it } from 'vitest'
import { formatDate, formatLapTime, formatPercent } from './format'

describe('format helpers', () => {
  it('formats an ISO date in the given language without timezone drift', () => {
    expect(formatDate('2026-09-06', 'en')).toBe('Sep 6, 2026')
    expect(formatDate('2026-09-06', 'es')).toMatch(/^6 (de )?sep/)
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
