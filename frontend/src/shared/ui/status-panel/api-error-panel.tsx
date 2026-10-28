import { useTranslation } from 'react-i18next'
import type { AppError, AppErrorKind } from '@/shared/api/app-error'
import { Button } from '@/shared/ui/button'
import { technicalLine } from '@/shared/api/technical-line'
import { ErrorIcon, RetryIcon } from '@/shared/ui/icons'
import { StatusFrame } from './status-frame'

interface ApiErrorFrameProps {
  title: string
  body: string
  actionLabel: string
  onAction: () => void
  technical: string
}

export function ApiErrorFrame({
  title,
  body,
  actionLabel,
  onAction,
  technical,
}: ApiErrorFrameProps) {
  const { t } = useTranslation()

  return (
    <StatusFrame tone="error" role="alert" icon={<ErrorIcon />} title={title}>
      <p className="mt-1 text-body text-ink-muted">
        {body} {t('status.apiError.reassurance')}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button icon={<RetryIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
      {technical && (
        <p className="mt-3 font-mono text-caption leading-[inherit] text-ink-faint">{technical}</p>
      )}
    </StatusFrame>
  )
}

interface ApiErrorPanelProps {
  error: AppError
  onRetry: () => void
  onBack?: () => void
}

const BODY_KEYS: Partial<Record<AppErrorKind, string>> = {
  network: 'network',
  'not-found': 'notFound',
}

function upstreamReason(error: AppError): string | undefined {
  const details = error.details
  if (typeof details !== 'object' || details === null) return undefined
  const reason = (details as Record<string, unknown>).reason
  return typeof reason === 'string' ? reason : undefined
}

export function ApiErrorPanel({ error, onRetry, onBack }: ApiErrorPanelProps) {
  const { t, i18n } = useTranslation()
  const notFound = error.kind === 'not-found'
  const bodyKey = BODY_KEYS[error.kind] ?? 'default'
  const reasonKey = error.kind === 'upstream' ? upstreamReason(error) : undefined
  const reasonPath = `status.apiError.upstreamReason.${reasonKey}`
  const reasonText = reasonKey && i18n.exists(reasonPath) ? t(reasonPath) : undefined
  const body = t(`status.apiError.body.${bodyKey}`)

  return (
    <ApiErrorFrame
      title={notFound ? t('status.apiError.title.notFound') : t('status.apiError.title.default')}
      body={reasonText ? `${body} ${reasonText}` : body}
      actionLabel={notFound ? t('common.backToCalendar') : t('common.retry')}
      onAction={notFound && onBack ? onBack : onRetry}
      technical={technicalLine(error)}
    />
  )
}

interface ApiEmptyPanelProps {
  technical: string
  onRetry: () => void
}

export function ApiEmptyPanel({ technical, onRetry }: ApiEmptyPanelProps) {
  const { t } = useTranslation()

  return (
    <ApiErrorFrame
      title={t('status.apiError.title.empty')}
      body={t('status.apiError.body.empty')}
      actionLabel={t('common.retry')}
      onAction={onRetry}
      technical={technical}
    />
  )
}
