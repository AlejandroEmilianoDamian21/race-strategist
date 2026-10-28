import { describe, expect, it } from 'vitest'
import { formatDelta, formatStintTime, formatTotalTime } from './format'

describe('formatTotalTime', () => {
  it('writes hours, minutes and milliseconds', () => {
    expect(formatTotalTime(5287.242)).toBe('1:28:07.242')
    expect(formatTotalTime(3600)).toBe('1:00:00.000')
    expect(formatTotalTime(61.5)).toBe('0:01:01.500')
  })

  it('carries a rounded-up millisecond into the next unit', () => {
    expect(formatTotalTime(59.9996)).toBe('0:01:00.000')
  })
})

describe('formatStintTime', () => {
  it('writes minutes and one decimal', () => {
    expect(formatStintTime(83.46)).toBe('1:23.5')
    expect(formatStintTime(5.04)).toBe('0:05.0')
    expect(formatStintTime(1953.2)).toBe('32:33.2')
  })

  it('carries a rounded-up tenth into the next minute', () => {
    expect(formatStintTime(59.96)).toBe('1:00.0')
  })
})

describe('formatDelta', () => {
  it('signs gains, losses and ties', () => {
    expect(formatDelta(22)).toBe('+22.0s')
    expect(formatDelta(-3.44)).toBe('−3.4s')
    expect(formatDelta(0)).toBe('±0.0s')
  })

  it('switches to m:ss.s above a minute', () => {
    expect(formatDelta(-149.2)).toBe('−2:29.2')
    expect(formatDelta(60)).toBe('+1:00.0')
    expect(formatDelta(59.94)).toBe('+59.9s')
  })
})
