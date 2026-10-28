import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { BoltIcon, PlusIcon } from '@/shared/ui/icons'

interface SimulateBarProps {
  errorCount: number
  hasDriver: boolean
  raceLaps: number
  progress: number | null
  onAddStop: () => void
  onSimulate: () => void
}

export function SimulateBar({
  errorCount,
  hasDriver,
  raceLaps,
  progress,
  onAddStop,
  onSimulate,
}: SimulateBarProps) {
  const { t } = useTranslation()
  const label = t('strategy.simulate.action')
  const reason =
    errorCount > 0
      ? t('strategy.simulate.fixErrors', { count: errorCount })
      : hasDriver
        ? null
        : t('strategy.simulate.pickDriver')

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
      <Button variant="secondary" icon={<PlusIcon />} onClick={onAddStop}>
        {t('strategy.actions.add')}
      </Button>
      <div className="flex flex-wrap items-center gap-4 [&>div]:flex-row-reverse">
        {progress !== null ? (
          <Button
            size="lg"
            loading
            progress={progress}
            loadingText={t('strategy.simulate.loading', {
              lap: Math.max(1, Math.round(progress * raceLaps)),
              total: raceLaps,
            })}
            icon={<BoltIcon />}
          >
            {label}
          </Button>
        ) : reason === null ? (
          <Button size="lg" icon={<BoltIcon />} onClick={onSimulate}>
            {label}
          </Button>
        ) : (
          <Button size="lg" icon={<BoltIcon />} disabled hint={reason}>
            {label}
          </Button>
        )}
      </div>
    </div>
  )
}
