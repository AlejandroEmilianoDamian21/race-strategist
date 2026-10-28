import { useQueryClient, type QueryKey, type UseQueryResult } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { AppError, isAppError } from '@/shared/api/app-error'
import { useWakeState } from './use-wake-state'

export type QueryStatus<TData> =
  | { kind: 'loading' }
  | { kind: 'waking'; elapsedSeconds: number }
  | { kind: 'timed-out' }
  | { kind: 'error'; error: AppError }
  | { kind: 'success'; data: TData }

export function useQueryStatus<TData>(
  query: UseQueryResult<TData, Error>,
  queryKey: QueryKey,
): {
  status: QueryStatus<TData>
  retry: () => void
} {
  const queryClient = useQueryClient()
  const [attempt, setAttempt] = useState(0)
  const inFlight = query.isFetching && query.data === undefined
  const wake = useWakeState(inFlight, attempt)
  const { refetch } = query

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
    void queryClient.cancelQueries({ queryKey }).then(() => refetch())
  }, [queryClient, queryKey, refetch])

  return { status: select(query, inFlight, wake), retry }
}

function select<TData>(
  query: UseQueryResult<TData, Error>,
  inFlight: boolean,
  wake: ReturnType<typeof useWakeState>,
): QueryStatus<TData> {
  if (inFlight) {
    if (wake.state === 'timed-out') return { kind: 'timed-out' }
    if (wake.state === 'waking') return { kind: 'waking', elapsedSeconds: wake.elapsedSeconds }
    return { kind: 'loading' }
  }
  if (query.isError) {
    return {
      kind: 'error',
      error: isAppError(query.error) ? query.error : new AppError('unknown'),
    }
  }
  if (query.data === undefined) return { kind: 'loading' }
  return { kind: 'success', data: query.data }
}
