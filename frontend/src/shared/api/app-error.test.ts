import { describe, expect, it } from 'vitest'
import { AppError, toAppError } from './app-error'

describe('toAppError', () => {
  it('maps 502 UPSTREAM_UNAVAILABLE to upstream keeping the reason', () => {
    const error = toAppError(502, {
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'down',
      details: { reason: 'timeout', resource: '/api/races' },
    })

    expect(error).toBeInstanceOf(AppError)
    expect(error.kind).toBe('upstream')
    expect(error.status).toBe(502)
    expect(error.details).toEqual({
      reason: 'timeout',
      resource: '/api/races',
    })
  })

  it('keeps the request context and backend message', () => {
    const error = toAppError(
      500,
      { statusCode: 500, code: 'INTERNAL_ERROR', message: 'boom' },
      { method: 'GET', path: '/api/races' },
    )

    expect(error).toMatchObject({
      statusCode: 500,
      method: 'GET',
      path: '/api/races',
      backendMessage: 'boom',
    })
  })

  it('maps any 404 to not-found', () => {
    expect(toAppError(404, { statusCode: 404, code: 'RACE_NOT_FOUND', message: 'x' }).kind).toBe(
      'not-found',
    )
    expect(toAppError(404, { statusCode: 404, code: 'NOT_FOUND', message: 'x' }).kind).toBe(
      'not-found',
    )
  })

  it('maps 400 INVALID_STRATEGY to invalid-strategy with violations', () => {
    const violations = [
      {
        code: 'LAPS_MISMATCH',
        field: 'stints',
        params: { expected: 53, actual: 51 },
        message: 'm',
      },
    ]
    const error = toAppError(400, {
      statusCode: 400,
      code: 'INVALID_STRATEGY',
      message: 'bad',
      details: violations,
    })

    expect(error.kind).toBe('invalid-strategy')
    expect(error.violations).toEqual(violations)
  })

  it('maps 400 VALIDATION_FAILED to validation', () => {
    const error = toAppError(400, {
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'bad',
      details: ['raceId should not be empty'],
    })

    expect(error.kind).toBe('validation')
    expect(error.details).toEqual(['raceId should not be empty'])
  })

  it('maps anything else to unknown', () => {
    expect(toAppError(500, { statusCode: 500, code: 'INTERNAL_ERROR', message: 'x' }).kind).toBe(
      'unknown',
    )
    expect(toAppError(418, undefined).kind).toBe('unknown')
  })

  it('does not crash on non-object bodies', () => {
    expect(toAppError(502, '<html>Bad gateway</html>').kind).toBe('unknown')
    expect(toAppError(400, null).kind).toBe('unknown')
  })
})
