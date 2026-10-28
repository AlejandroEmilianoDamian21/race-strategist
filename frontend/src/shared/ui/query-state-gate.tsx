import type { ReactNode } from 'react'
import { AppError, type RequestContext } from '@/shared/api/app-error'
import type { QueryStatus } from '@/shared/hooks/use-query-status'
import { StatusPanel } from './status-panel/status-panel'

interface QueryStateGateProps<TData> {
  status: QueryStatus<TData>
  onRetry: () => void
  onBack?: () => void
  request?: RequestContext
  loading: ReactNode
  children: (data: TData) => ReactNode
}

export function QueryStateGate<TData>({
  status,
  onRetry,
  onBack,
  request,
  loading,
  children,
}: QueryStateGateProps<TData>) {
  switch (status.kind) {
    case 'error':
      return (
        <StatusPanel variant="api-error" error={status.error} onRetry={onRetry} onBack={onBack} />
      )
    case 'timed-out':
      return (
        <StatusPanel
          variant="api-error"
          error={new AppError('timeout', request)}
          onRetry={onRetry}
        />
      )
    case 'waking':
      return (
        <>
          <StatusPanel variant="wake" elapsedSeconds={status.elapsedSeconds} />
          <div className="mt-4">{loading}</div>
        </>
      )
    case 'loading':
      return loading
    case 'success':
      return children(status.data)
  }
}
