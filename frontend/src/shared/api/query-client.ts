import { QueryClient } from '@tanstack/react-query'
import { isAppError } from './app-error'

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isAppError(error)) {
    if (error.kind === 'timeout') return false
    if (error.status !== undefined && error.status >= 400 && error.status < 500) return false
  }
  return failureCount < 1
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, refetchOnWindowFocus: false },
    },
  })
}
