import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { BoltIcon } from '@/shared/ui/icons'

interface SimulateBarProps {
  errorCount: number
  hasDriver: boolean
  onSimulate: () => void
}

export function SimulateBar({ errorCount, hasDriver, onSimulate }: SimulateBarProps) {
  const { t } = useTranslation()
  const label = t('strategy.simulate.action')
  const reason =
    errorCount > 0
      ? t('strategy.simulate.fixErrors', { count: errorCount })
      : hasDriver
        ? null
        : t('strategy.simulate.pickDriver')

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg p-4 min-[720px]:static min-[720px]:flex min-[720px]:justify-end min-[720px]:border-t-0 min-[720px]:bg-transparent min-[720px]:p-0 [&_button]:max-[719px]:w-full min-[720px]:[&>div]:flex-row-reverse">
      {reason === null ? (
        <Button size="lg" icon={<BoltIcon />} onClick={onSimulate}>
          {label}
        </Button>
      ) : (
        <Button size="lg" icon={<BoltIcon />} disabled hint={reason}>
          {label}
        </Button>
      )}
    </div>
  )
}
