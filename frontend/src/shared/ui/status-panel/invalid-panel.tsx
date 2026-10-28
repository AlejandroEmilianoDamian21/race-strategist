import { useTranslation } from 'react-i18next'
import type { StrategyViolation } from '@/shared/api/types'
import { translateViolation } from '@/shared/i18n/translate-violation'
import { Button } from '@/shared/ui/button'
import { AlertIcon, ArrowLeftIcon } from '@/shared/ui/icons'
import { StatusFrame } from './status-frame'

interface InvalidPanelProps {
  violations: StrategyViolation[]
  onBack: () => void
}

export function InvalidPanel({ violations, onBack }: InvalidPanelProps) {
  const { t } = useTranslation()

  return (
    <StatusFrame tone="error" role="alert" icon={<AlertIcon />} title={t('status.invalid.title')}>
      <p className="mt-1 text-body text-ink-muted">
        {t('status.invalid.body', { count: violations.length })}
      </p>
      <ul className="mt-4 list-none border-t border-danger p-0">
        {violations.map((violation, index) => (
          <li
            key={`${violation.code}-${violation.field ?? ''}-${index}`}
            className="grid gap-1 border-b border-line py-3 text-[14px] min-[720px]:grid-cols-[160px_1fr] min-[720px]:gap-3"
          >
            <code className="font-mono text-caption font-bold text-danger">{violation.field}</code>
            <span>{translateViolation(t, violation)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" icon={<ArrowLeftIcon />} onClick={onBack}>
          {t('common.backToStrategy')}
        </Button>
      </div>
    </StatusFrame>
  )
}
