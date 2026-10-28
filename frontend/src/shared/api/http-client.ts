import { AppError, toAppError } from './app-error'

export const DEFAULT_TIMEOUT_MS = 90_000

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  timeoutMs?: number
  signal?: AbortSignal
}

const baseUrl: string = import.meta.env.VITE_API_URL ?? ''

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'TimeoutError'
  )
}

function toTransportError(error: unknown, external: AbortSignal | undefined): unknown {
  if (external?.aborted && !isTimeoutError(error)) return error
  return new AppError(isTimeoutError(error) ? 'timeout' : 'network', { cause: error })
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
      signal: controller.signal,
    })
  }
  return controller.signal
}

function withTimeout(external: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return external ? anySignal([external, timeout]) : timeout
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: withTimeout(signal, timeoutMs),
    })
  } catch (error) {
    throw toTransportError(error, signal)
  }

  const payload = await readJson(response)
  if (!response.ok) throw toAppError(response.status, payload)
  if (payload === undefined) throw new AppError('unknown', { status: response.status })
  return payload as T
}
