import type { StrategyViolation } from './types'

export type AppErrorKind =
  'network' | 'timeout' | 'upstream' | 'not-found' | 'invalid-strategy' | 'validation' | 'unknown'

export interface AppErrorOptions {
  status?: number
  code?: string
  violations?: StrategyViolation[]
  details?: unknown
  cause?: unknown
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly status?: number
  readonly code?: string
  readonly violations?: StrategyViolation[]
  readonly details?: unknown

  constructor(kind: AppErrorKind, options: AppErrorOptions = {}) {
    super(kind, { cause: options.cause })
    this.name = 'AppError'
    this.kind = kind
    this.status = options.status
    this.code = options.code
    this.violations = options.violations
    this.details = options.details
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}

interface ErrorBody {
  code?: string
  details?: unknown
}

function readBody(body: unknown): ErrorBody {
  if (typeof body !== 'object' || body === null) return {}
  const record = body as Record<string, unknown>
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    details: record.details,
  }
}

function kindFor(status: number, code: string | undefined): AppErrorKind {
  if (status === 404) return 'not-found'
  if (status === 502 && code === 'UPSTREAM_UNAVAILABLE') return 'upstream'
  if (status === 400 && code === 'INVALID_STRATEGY') return 'invalid-strategy'
  if (status === 400 && code === 'VALIDATION_FAILED') return 'validation'
  return 'unknown'
}

export function toAppError(status: number, body: unknown): AppError {
  const { code, details } = readBody(body)
  const kind = kindFor(status, code)
  const violations =
    kind === 'invalid-strategy' && Array.isArray(details)
      ? (details as StrategyViolation[])
      : undefined
  return new AppError(kind, { status, code, details, violations })
}
