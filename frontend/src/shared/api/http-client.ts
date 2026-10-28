import { AppError, toAppError } from './app-error'

export const DEFAULT_TIMEOUT_MS = 90_000

export interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  timeoutMs?: number
}

const baseUrl: string = import.meta.env.VITE_API_URL ?? ''

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function toTransportError(error: unknown): AppError {
  const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
  return new AppError(isTimeout ? 'timeout' : 'network', { cause: error })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw toTransportError(error)
  }

  const payload = await readJson(response)
  if (!response.ok) throw toAppError(response.status, payload)
  if (payload === undefined) throw new AppError('unknown', { status: response.status })
  return payload as T
}
