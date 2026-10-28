import { useTranslation } from 'react-i18next'
import { AppError } from '@/shared/api/app-error'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { SectionHead } from '@/shared/ui/section-head'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { RACES_QUERY_KEY, useRaces } from './use-races'

export function RacesStepPlaceholder() {
  const { t } = useTranslation()
  const { status, retry } = useQueryStatus(useRaces(), RACES_QUERY_KEY)

  return (
    <section aria-labelledby="step-race-title" className="scroll-mt-24">
      <SectionHead step={1} title={t('races.title')} titleId="step-race-title" />
      {status.kind === 'error' ? (
        <StatusPanel variant="api-error" error={status.error} onRetry={retry} />
      ) : status.kind === 'timed-out' ? (
        <StatusPanel variant="api-error" error={new AppError('timeout')} onRetry={retry} />
      ) : status.kind === 'waking' ? (
        <StatusPanel variant="wake" elapsedSeconds={status.elapsedSeconds} />
      ) : status.kind === 'loading' ? (
        <p className="text-body text-ink-muted">{t('races.loading')}</p>
      ) : (
        <p className="text-body text-ink-muted">
          {t('races.loaded', { count: status.data.length })}
        </p>
      )}
    </section>
  )
}
