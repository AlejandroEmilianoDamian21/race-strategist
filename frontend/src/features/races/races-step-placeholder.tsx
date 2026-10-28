import { useTranslation } from 'react-i18next'
import { AppError, isAppError } from '@/shared/api/app-error'
import { useWakeState } from '@/shared/hooks/use-wake-state'
import { SectionHead } from '@/shared/ui/section-head'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { useRaces } from './use-races'

export function RacesStepPlaceholder() {
  const { t } = useTranslation()
  const races = useRaces()
  const wake = useWakeState(races.isPending)
  const retry = () => void races.refetch()

  return (
    <section aria-labelledby="step-race-title" className="scroll-mt-24">
      <SectionHead step={1} title={t('races.title')} titleId="step-race-title" />
      {races.isError ? (
        <StatusPanel
          variant="api-error"
          error={isAppError(races.error) ? races.error : new AppError('unknown')}
          onRetry={retry}
        />
      ) : wake.state === 'timed-out' ? (
        <StatusPanel variant="api-error" error={new AppError('timeout')} onRetry={retry} />
      ) : wake.state === 'waking' ? (
        <StatusPanel variant="wake" elapsedSeconds={wake.elapsedSeconds} />
      ) : races.isPending ? (
        <p className="text-body text-ink-muted">{t('races.loading')}</p>
      ) : (
        <p className="text-body text-ink-muted">
          {t('races.loaded', { count: races.data.length })}
        </p>
      )}
    </section>
  )
}
