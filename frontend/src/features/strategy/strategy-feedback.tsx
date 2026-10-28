import { useTranslation } from 'react-i18next'
import { rainLevel } from '@/features/races/format'
import type { StrategyViolation } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { translateViolation } from '@/shared/i18n/translate-violation'
import { AlertIcon, ErrorIcon } from '@/shared/ui/icons'
import type { RainWarning } from './rain-warnings'

interface StrategyFeedbackProps {
  errors: StrategyViolation[]
  warnings: RainWarning[]
}

export function StrategyFeedback({ errors, warnings }: StrategyFeedbackProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')

  if (errors.length === 0 && warnings.length === 0) return null

  return (
    <div aria-live="polite" className="grid gap-2">
      {errors.length > 0 && (
        <ul
          aria-label={t('strategy.feedback.errors')}
          className="m-0 grid list-none gap-1 rounded-sm border border-danger bg-danger-surface p-3 text-label"
        >
          {errors.map((error, index) => (
            <li key={`${error.code}-${error.field ?? ''}-${index}`} className="flex gap-2 text-ink">
              <ErrorIcon className="mt-0.5 size-4 flex-none text-danger" />
              <span>{translateViolation(t, error)}</span>
            </li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul
          aria-label={t('strategy.feedback.warnings')}
          className="m-0 grid list-none gap-1 rounded-sm border border-warning bg-warning-surface p-3 text-label"
        >
          {warnings.map((warning) => (
            <li
              key={`${warning.stintIndex}-${warning.fromLap}-${warning.toLap}`}
              className="flex gap-2 text-ink"
            >
              <AlertIcon className="mt-0.5 size-4 flex-none text-warning" />
              <span>
                {t('strategy.warning.message', {
                  stint: warning.stintIndex + 1,
                  compound: t(compoundNameKey(warning.compound)),
                  lap,
                  from: warning.fromLap,
                  to: warning.toLap,
                  rain: t(`strategy.warning.rain.${rainLevel(warning.rainIntensity)}`),
                  intensity: warning.rainIntensity,
                  loss: warning.lossPerLap.toFixed(1),
                })}
                {warning.idealCompound !== null &&
                  ` ${t('strategy.warning.ideal', { compound: t(compoundNameKey(warning.idealCompound)) })}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
