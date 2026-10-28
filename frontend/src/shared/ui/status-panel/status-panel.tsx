import { useTranslation } from 'react-i18next'
import type { AppError } from '@/shared/api/app-error'
import type { StrategyViolation } from '@/shared/api/types'
import { toPercent } from '@/shared/lib/to-percent'
import { BoltIcon, FlagIcon } from '@/shared/ui/icons'
import { ProgressBar } from '@/shared/ui/progress-bar'
import { Card } from '@/shared/ui/card'
import { ApiEmptyPanel, ApiErrorPanel } from './api-error-panel'
import { InvalidPanel } from './invalid-panel'
import { StatusFrame } from './status-frame'
import { WakePanel } from './wake-panel'

export type StatusPanelProps =
  | { variant: 'wake'; elapsedSeconds: number }
  | { variant: 'api-error'; error: AppError; onRetry: () => void; onBack?: () => void }
  | { variant: 'api-empty'; technical: string; onRetry: () => void }
  | { variant: 'empty-race' }
  | { variant: 'invalid'; violations: StrategyViolation[]; onBack: () => void }
  | { variant: 'empty-result' }
  | { variant: 'sim-loading'; lap: number; totalLaps: number }

export function StatusPanel(props: StatusPanelProps) {
  const { t } = useTranslation()

  switch (props.variant) {
    case 'wake':
      return <WakePanel elapsedSeconds={props.elapsedSeconds} />
    case 'api-error':
      return <ApiErrorPanel error={props.error} onRetry={props.onRetry} onBack={props.onBack} />
    case 'api-empty':
      return <ApiEmptyPanel technical={props.technical} onRetry={props.onRetry} />
    case 'invalid':
      return <InvalidPanel violations={props.violations} onBack={props.onBack} />
    case 'empty-race':
      return (
        <StatusFrame tone="empty" icon={<FlagIcon />} title={t('status.emptyRace.title')}>
          <p className="mt-1 text-body text-ink-muted">{t('status.emptyRace.body')}</p>
        </StatusFrame>
      )
    case 'empty-result':
      return (
        <StatusFrame tone="empty" icon={<BoltIcon />} title={t('status.emptyResult.title')}>
          <p className="mt-1 text-body text-ink-muted">{t('status.emptyResult.body')}</p>
        </StatusFrame>
      )
    case 'sim-loading': {
      const label = t('status.simLoading.label', {
        lap: props.lap,
        total: props.totalLaps,
      })
      return (
        <Card cut aria-busy="true" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
              {label}
            </p>
            <span className="font-mono text-caption tabular-nums text-ink-faint">
              {Math.round(toPercent(props.lap, props.totalLaps))}%
            </span>
          </div>
          <ProgressBar
            className="mt-4"
            tone="accent"
            value={props.lap}
            max={props.totalLaps}
            label={t('status.simLoading.progressLabel')}
          />
        </Card>
      )
    }
  }
}
