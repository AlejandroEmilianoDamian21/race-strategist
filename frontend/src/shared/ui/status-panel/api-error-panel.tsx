import { useTranslation } from 'react-i18next'
import type { AppError, AppErrorKind } from '@/shared/api/app-error'
import { Button } from '@/shared/ui/button'
import { technicalLine } from '@/shared/api/technical-line'
import { ErrorIcon, RetryIcon } from '@/shared/ui/icons'
import { StatusFrame } from './status-frame'

interface ApiErrorPanelProps {
  error: AppError
  onRetry: () => void
}

const BODY_KEYS: Partial<Record<AppErrorKind, string>> = {
  network: 'network',
  timeout: 'timeout',
  upstream: 'upstream',
  'not-found': 'notFound',
}

function upstreamReason(error: AppError): string | undefined {
  const details = error.details
  if (typeof details !== 'object' || details === null) return undefined
  const reason = (details as Record<string, unknown>).reason
  return typeof reason === 'string' ? reason : undefined
}

export function ApiErrorPanel({ error, onRetry }: ApiErrorPanelProps) {
  const { t, i18n } = useTranslation()
  const notFound = error.kind === 'not-found'
  const bodyKey = BODY_KEYS[error.kind] ?? 'unknown'
  const reasonKey = error.kind === 'upstream' ? upstreamReason(error) : undefined
  const reasonPath = `status.apiError.upstreamReason.${reasonKey}`
  const reasonText = reasonKey && i18n.exists(reasonPath) ? t(reasonPath) : undefined
  const technical = technicalLine(error)

  return (
    <StatusFrame
      tone="error"
      role="alert"
      icon={<ErrorIcon />}
      title={notFound ? t('status.apiError.title.notFound') : t('status.apiError.title.default')}
    >
      <p className="mt-1 text-body text-ink-muted">
        {t(`status.apiError.body.${bodyKey}`)}
        {reasonText && ` ${reasonText}`} {t('status.apiError.reassurance')}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button icon={<RetryIcon />} onClick={onRetry}>
          {notFound ? t('common.backToCalendar') : t('common.retry')}
        </Button>
      </div>
      {technical && <p className="mt-3 font-mono text-caption text-ink-faint">{technical}</p>}
    </StatusFrame>
  )
}
