import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { AppError } from '@/shared/api/app-error'
import { useQueryStatus } from './use-query-status'

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

const KEY = ['things'] as const

describe('useQueryStatus', () => {
  it('reports the error while cached data exists (error wins over stale data)', async () => {
    const client = createClient()
    client.setQueryData(KEY, ['cached'])
    const queryFn = async () => {
      throw new AppError('network')
    }
    const { result } = renderHook(
      () => useQueryStatus(useQuery({ queryKey: KEY, queryFn, staleTime: 0 }), KEY),
      { wrapper: wrapperFor(client) },
    )

    await waitFor(() => expect(result.current.status.kind).toBe('error'))
  })

  it('stays success during a background refetch while data exists', async () => {
    const client = createClient()
    client.setQueryData(KEY, ['cached'])
    let release!: (value: string[]) => void
    const queryFn = () => new Promise<string[]>((resolve) => (release = resolve))
    const { result } = renderHook(
      () => useQueryStatus(useQuery({ queryKey: KEY, queryFn, staleTime: 0 }), KEY),
      { wrapper: wrapperFor(client) },
    )

    expect(result.current.status).toEqual({ kind: 'success', data: ['cached'] })
    await waitFor(() => expect(client.isFetching({ queryKey: KEY })).toBe(1))
    expect(result.current.status).toEqual({ kind: 'success', data: ['cached'] })

    await act(async () => release(['fresh']))
    await waitFor(() => expect(result.current.status).toEqual({ kind: 'success', data: ['fresh'] }))
  })

  it('retrying a query does not cancel an in-flight query under the same key prefix', async () => {
    const client = createClient()
    const rootKey = ['races'] as const
    const childKey = ['races', 'monza', 'overview'] as const
    let childSignal: AbortSignal | undefined
    void client.prefetchQuery({
      queryKey: childKey,
      queryFn: ({ signal }) => {
        childSignal = signal
        return new Promise<string>(() => undefined)
      },
    })
    const { result } = renderHook(
      () =>
        useQueryStatus(
          useQuery({ queryKey: rootKey, queryFn: async () => ['race'], staleTime: 0 }),
          rootKey,
        ),
      { wrapper: wrapperFor(client) },
    )
    await waitFor(() => expect(result.current.status.kind).toBe('success'))
    expect(childSignal?.aborted).toBe(false)

    await act(async () => result.current.retry())

    expect(childSignal?.aborted).toBe(false)
  })
})
