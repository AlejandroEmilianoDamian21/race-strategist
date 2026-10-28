import type { StrategyViolation } from './types'

export type AppErrorKind =
  'network' | 'timeout' | 'upstream' | 'not-found' | 'invalid-strategy' | 'validation' | 'unknown'

export interface RequestContext {
  method: string
  path: string
}

export interface AppErrorOptions {
  method?: string
  path?: string
  status?: number
  backendMessage?: string
  code?: string
  violations?: StrategyViolation[]
  details?: unknown
  cause?: unknown
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly method?: string
  readonly path?: string
  readonly status?: number
  readonly statusCode?: number
  readonly backendMessage?: string
  readonly code?: string
  readonly violations?: StrategyViolation[]
  readonly details?: unknown

  constructor(kind: AppErrorKind, options: AppErrorOptions = {}) {
    super(kind, { cause: options.cause })
    this.name = 'AppError'
    this.kind = kind
    this.method = options.method
    this.path = options.path
    this.status = options.status
    this.statusCode = options.status
    this.backendMessage = options.backendMessage
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
  message?: string
  details?: unknown
}

function readBody(body: unknown): ErrorBody {
  if (typeof body !== 'object' || body === null) return {}
  const record = body as Record<string, unknown>
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
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

export function toAppError(status: number, body: unknown, context?: RequestContext): AppError {
  const { code, message, details } = readBody(body)
  const kind = kindFor(status, code)
  const violations =
    kind === 'invalid-strategy' && Array.isArray(details)
      ? (details as StrategyViolation[])
      : undefined
  return new AppError(kind, {
    ...context,
    status,
    code,
    backendMessage: message,
    details,
    violations,
  })
}
