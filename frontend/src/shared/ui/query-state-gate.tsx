import type { ReactNode } from 'react'
import { AppError } from '@/shared/api/app-error'
import type { QueryStatus } from '@/shared/hooks/use-query-status'
import { StatusPanel } from './status-panel/status-panel'

interface QueryStateGateProps<TData> {
  status: QueryStatus<TData>
  onRetry: () => void
  loading: ReactNode
  children: (data: TData) => ReactNode
}

export function QueryStateGate<TData>({
  status,
  onRetry,
  loading,
  children,
}: QueryStateGateProps<TData>) {
  switch (status.kind) {
    case 'error':
      return <StatusPanel variant="api-error" error={status.error} onRetry={onRetry} />
    case 'timed-out':
      return <StatusPanel variant="api-error" error={new AppError('timeout')} onRetry={onRetry} />
    case 'waking':
      return <StatusPanel variant="wake" elapsedSeconds={status.elapsedSeconds} />
    case 'loading':
      return loading
    case 'success':
      return children(status.data)
  }
}
