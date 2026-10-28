import { describe, expect, it } from 'vitest'
import { AppError } from './app-error'
import { shouldRetry } from './query-client'

describe('shouldRetry', () => {
  it('never retries client errors', () => {
    expect(shouldRetry(0, new AppError('not-found', { status: 404 }))).toBe(false)
    expect(shouldRetry(0, new AppError('invalid-strategy', { status: 400 }))).toBe(false)
  })

  it('never retries timeouts', () => {
    expect(shouldRetry(0, new AppError('timeout'))).toBe(false)
  })

  it('retries transient failures once', () => {
    expect(shouldRetry(0, new AppError('network'))).toBe(true)
    expect(shouldRetry(0, new AppError('upstream', { status: 502 }))).toBe(true)
    expect(shouldRetry(1, new AppError('upstream', { status: 502 }))).toBe(false)
  })
})
