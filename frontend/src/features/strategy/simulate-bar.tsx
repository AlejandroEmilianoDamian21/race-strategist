import { useTranslation } from 'react-i18next'
import { MobileCta } from '@/shared/layout/mobile-cta'
import { Button } from '@/shared/ui/button'
import { BoltIcon, PlusIcon } from '@/shared/ui/icons'

interface SimulateBarProps {
  errorCount: number
  hasDriver: boolean
  raceLaps: number
  progress: number | null
  canAddStop: boolean
  onAddStop: () => void
  onSimulate: () => void
}

export function SimulateBar({
  errorCount,
  hasDriver,
  raceLaps,
  progress,
  canAddStop,
  onAddStop,
  onSimulate,
}: SimulateBarProps) {
  const { t } = useTranslation()
  const label = t('strategy.simulate.action')
  const lap = progress === null ? 0 : Math.max(1, Math.round(progress * raceLaps))
  const reason =
    errorCount > 0
      ? t('strategy.simulate.fixErrors', { count: errorCount })
      : hasDriver
        ? null
        : t('strategy.simulate.pickDriver')
  const barReason =
    errorCount > 0 ? t('strategy.simulate.fixErrorsShort') : t('strategy.simulate.pickDriver')

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
      {canAddStop ? (
        <Button variant="secondary" icon={<PlusIcon />} onClick={onAddStop}>
          {t('strategy.actions.add')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          icon={<PlusIcon />}
          disabled
          hint={t('strategy.actions.addMax')}
        >
          {t('strategy.actions.add')}
        </Button>
      )}
      <div className="flex flex-wrap items-center gap-4 max-[720px]:[&_button]:hidden [&>div]:flex-row-reverse">
        {progress !== null ? (
          <Button
            size="lg"
            loading
            progress={progress}
            loadingText={t('strategy.simulate.loading', { lap, total: raceLaps })}
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
      <MobileCta>
        <div className="flex flex-1 [&>div]:flex-1 [&>div]:flex-row-reverse [&>div]:flex-nowrap [&_button]:flex-1">
          {progress !== null ? (
            <Button
              size="lg"
              loading
              progress={progress}
              loadingText={t('strategy.simulate.loadingShort', { lap, total: raceLaps })}
              icon={<BoltIcon />}
            >
              {label}
            </Button>
          ) : reason === null ? (
            <Button size="lg" icon={<BoltIcon />} onClick={onSimulate}>
              {label}
            </Button>
          ) : (
            <Button size="lg" icon={<BoltIcon />} disabled hint={barReason}>
              {label}
            </Button>
          )}
        </div>
      </MobileCta>
    </div>
  )
}
