import { Trans, useTranslation } from 'react-i18next'
import { formatElapsed } from '@/shared/hooks/use-wake-state'
import { cn } from '@/shared/lib/cn'
import { CheckIcon, ClockIcon, DotIcon, ServerIcon } from '@/shared/ui/icons'
import { ProgressBar } from '@/shared/ui/progress-bar'
import { StatusFrame } from './status-frame'

const EXPECTED_SECONDS = 60
const RACES_STEP_AT_SECONDS = 30
const PROGRESS_CAP_PERCENT = 95

interface WakePanelProps {
  elapsedSeconds: number
}

type StepState = 'done' | 'now' | 'pending'

export function WakePanel({ elapsedSeconds }: WakePanelProps) {
  const { t } = useTranslation()
  const racesStarted = elapsedSeconds > RACES_STEP_AT_SECONDS
  const steps: { label: string; state: StepState }[] = [
    {
      label: t('status.wake.steps.connecting'),
      state: racesStarted ? 'done' : 'now',
    },
    {
      label: t('status.wake.steps.races'),
      state: racesStarted ? 'now' : 'pending',
    },
    { label: t('status.wake.steps.details'), state: 'pending' },
  ]

  return (
    <StatusFrame tone="wake" role="status" icon={<ServerIcon />} title={t('status.wake.title')}>
      <p className="mt-1 text-body text-ink-muted">
        <Trans i18nKey="status.wake.body" components={{ b: <b className="text-ink" /> }} />
      </p>
      <ProgressBar
        className="mt-4"
        value={Math.min(elapsedSeconds, EXPECTED_SECONDS)}
        max={EXPECTED_SECONDS}
        maxPercent={PROGRESS_CAP_PERCENT}
        label={t('status.wake.progressLabel')}
      />
      <div className="mt-2 flex justify-between font-mono text-caption leading-[inherit] tabular-nums text-ink-muted">
        <span>{t('status.wake.elapsed', { elapsed: formatElapsed(elapsedSeconds) })}</span>
        <span>{t('status.wake.expected')}</span>
      </div>
      <ul className="mt-4 grid list-none gap-1 p-0 text-[14px]">
        {steps.map(({ label, state }) => (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2 [&_svg]:size-4',
              state === 'pending' && 'text-ink-faint',
              state === 'done' && 'text-ink-muted [&_svg]:text-success',
              state === 'now' && 'text-ink [&_svg]:text-warning',
            )}
          >
            {state === 'done' ? <CheckIcon /> : state === 'now' ? <ClockIcon /> : <DotIcon />}
            {label}
          </li>
        ))}
      </ul>
    </StatusFrame>
  )
}
