import { describe, expect, it } from 'vitest'
import { AppError } from './app-error'
import { emptyListLine, technicalLine } from './technical-line'

describe('technicalLine', () => {
  it('joins request, status, code and backend message', () => {
    const error = new AppError('upstream', {
      method: 'GET',
      path: '/api/races',
      status: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      backendMessage: 'Upstream is down',
    })

    expect(technicalLine(error)).toBe(
      'GET /api/races → 502 · UPSTREAM_UNAVAILABLE · Upstream is down',
    )
  })

  it('omits missing parts cleanly', () => {
    const error = new AppError('unknown', { method: 'GET', path: '/api/races', status: 500 })

    expect(technicalLine(error)).toBe('GET /api/races → 500')
  })

  it('falls back to status and code without request context', () => {
    const error = new AppError('upstream', { status: 502, code: 'UPSTREAM_UNAVAILABLE' })

    expect(technicalLine(error)).toBe('502 · UPSTREAM_UNAVAILABLE')
  })

  it('describes transport failures', () => {
    const base = { method: 'POST', path: '/api/simulate' } as const

    expect(technicalLine(new AppError('network', base))).toBe('POST /api/simulate → network')
    expect(technicalLine(new AppError('timeout', base))).toBe('POST /api/simulate → timeout')
  })

  it('returns an empty string when there is nothing to show', () => {
    expect(technicalLine(new AppError('unknown'))).toBe('')
  })
})

describe('emptyListLine', () => {
  it('describes a successful response with an empty list', () => {
    expect(emptyListLine({ method: 'GET', path: '/api/races', key: 'races' })).toBe(
      'GET /api/races → 200 · races = [] (0 elementos)',
    )
  })
})
