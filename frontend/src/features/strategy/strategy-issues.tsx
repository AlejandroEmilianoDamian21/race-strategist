import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { rainLevel } from '@/features/races/format'
import type { StrategyViolation } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { translateViolation } from '@/shared/i18n/translate-violation'
import { cn } from '@/shared/lib/cn'
import { AlertIcon, ErrorIcon, OkIcon } from '@/shared/ui/icons'
import type { RainWarning } from './rain-warnings'

interface StrategyIssuesProps {
  errors: StrategyViolation[]
  warnings: RainWarning[]
  stops: number
  raceLaps: number
}

const TONE = {
  error: 'text-danger',
  warning: 'text-warning',
  ok: 'text-success',
} as const

function isFractional(laps: unknown): boolean {
  return typeof laps === 'number' && Number.isFinite(laps) && !Number.isInteger(laps)
}

const BOLD = { b: <b className="font-semibold text-ink" />, code: <code /> }

function Issue({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof TONE
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 text-[14px] leading-5 [&_svg]:mt-px [&_svg]:size-[18px] [&_svg]:flex-none',
        '[&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-ink',
        TONE[tone],
      )}
    >
      {icon}
      <span>{children}</span>
    </li>
  )
}

export function StrategyIssues({ errors, warnings, stops, raceLaps }: StrategyIssuesProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')

  function errorMessage(error: StrategyViolation): ReactNode {
    const params = error.params
    switch (error.code) {
      case 'STINT_TOO_SHORT':
        return (
          <Trans
            i18nKey={
              isFractional(params.laps)
                ? 'strategy.issues.stintWhole'
                : 'strategy.issues.stintShort'
            }
            values={params}
            components={BOLD}
          />
        )
      case 'UNKNOWN_COMPOUND':
        return <Trans i18nKey="strategy.issues.noCompound" values={params} components={BOLD} />
      case 'LAPS_MISMATCH': {
        const difference = Number(params.difference)
        return (
          <Trans
            i18nKey={difference > 0 ? 'strategy.issues.sumMissing' : 'strategy.issues.sumExtra'}
            count={Math.abs(difference)}
            values={{ sum: params.actual, total: params.expected }}
            components={BOLD}
          />
        )
      }
      case 'NOT_ENOUGH_PIT_STOPS':
        return (
          <Trans
            i18nKey="strategy.issues.minStops"
            count={Number(params.required)}
            components={BOLD}
          />
        )
      default:
        return translateViolation(t, error)
    }
  }

  return (
    <ul aria-live="polite" className="m-0 mt-4 grid list-none gap-2 p-0">
      {errors.map((error, index) => (
        <Issue
          key={`${error.code}-${error.field ?? ''}-${index}`}
          tone="error"
          icon={<ErrorIcon />}
        >
          {errorMessage(error)}
        </Issue>
      ))}
      {warnings.map((warning) => (
        <Issue key={`warning-${warning.stintIndex}`} tone="warning" icon={<AlertIcon />}>
          <Trans
            i18nKey="strategy.issues.warning"
            values={{
              stint: warning.stintIndex + 1,
              compound: t(compoundNameKey(warning.compound)),
              from: `${lap}${warning.fromLap}`,
              to: `${lap}${warning.toLap}`,
              rain: t(`strategy.warningRain.${rainLevel(warning.rainIntensity)}`),
              intensity: warning.rainIntensity,
              min: warning.band.min,
              max: warning.band.max,
              loss: warning.lossPerLap.toFixed(1),
            }}
            components={BOLD}
          />
          {warning.idealCompounds.length > 0 &&
            t('strategy.issues.ideal', {
              compounds: warning.idealCompounds
                .map((compound) => t(compoundNameKey(compound)))
                .join(t('strategy.issues.idealJoiner')),
            })}
        </Issue>
      ))}
      {errors.length === 0 && (
        <Issue tone="ok" icon={<OkIcon />}>
          {t('strategy.issues.valid', {
            stops:
              stops === 0
                ? t('strategy.issues.noStops')
                : t('strategy.issues.stops', { count: stops }),
            total: raceLaps,
          })}
        </Issue>
      )}
    </ul>
  )
}
