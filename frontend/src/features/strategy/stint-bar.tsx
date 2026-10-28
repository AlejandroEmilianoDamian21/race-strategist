import { useTranslation } from 'react-i18next'
import type { Stint, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { cn } from '@/shared/lib/cn'
import { toPercent } from '@/shared/lib/to-percent'
import { COMPOUND_LETTER } from '@/shared/ui/compound-letter'
import { AlertIcon } from '@/shared/ui/icons'
import { isTyreCompound } from './compounds'

const COMPOUND_BG: Record<TyreCompound, string> = {
  SOFT: 'bg-tyre-soft text-on-tyre',
  MEDIUM: 'bg-tyre-medium text-on-tyre',
  HARD: 'bg-tyre-hard text-on-tyre',
  INTERMEDIATE: 'bg-tyre-inter text-on-tyre',
  WET: 'bg-tyre-wet text-on-tyre',
}

const MIN_RAIN_OPACITY = 0.3

function segmentWidth(laps: number, scale: number): number {
  return Number.isFinite(laps) && laps > 0 ? toPercent(laps, scale) : 0
}

interface StintBarProps {
  stints: Stint[]
  raceLaps: number
  forecast: WeatherSegment[]
  invalidStints: ReadonlySet<number>
}

export function StintBar({ stints, raceLaps, forecast, invalidStints }: StintBarProps) {
  const { t } = useTranslation()
  const lapPrefix = t('raceInfo.drivers.lapShort')
  const total = stints.reduce(
    (sum, stint) => sum + (Number.isFinite(stint.laps) ? Math.max(0, stint.laps) : 0),
    0,
  )
  const scale = Math.max(raceLaps, total)

  return (
    <div>
      <div
        data-testid="weather-band"
        aria-hidden="true"
        className="relative mb-1 h-1.5 overflow-hidden bg-surface-2"
      >
        {forecast.map((segment) => {
          const wet = segment.rainIntensity > 0
          return (
            <span
              key={`${segment.fromLap}-${segment.toLap}`}
              data-rain={segment.rainIntensity}
              title={`${lapPrefix}${segment.fromLap}–${lapPrefix}${segment.toLap}`}
              className={cn('absolute inset-y-0', wet ? 'bg-rain' : 'bg-surface-3')}
              style={{
                left: `${toPercent(segment.fromLap - 1, raceLaps)}%`,
                width: `${toPercent(segment.toLap - segment.fromLap + 1, raceLaps)}%`,
                opacity: wet
                  ? MIN_RAIN_OPACITY + (1 - MIN_RAIN_OPACITY) * Math.min(1, segment.rainIntensity)
                  : 0.5,
              }}
            />
          )
        })}
      </div>
      <ol
        aria-label={t('strategy.bar.label')}
        className="m-0 flex h-12 list-none overflow-hidden bg-surface-2 p-0"
      >
        {stints.map((stint, index) => {
          const known = isTyreCompound(stint.compound)
          const invalid = invalidStints.has(index)
          const name = known ? t(`compounds.${stint.compound as TyreCompound}`) : stint.compound
          return (
            <li
              key={index}
              data-invalid={invalid ? 'true' : undefined}
              style={{ width: `${segmentWidth(stint.laps, scale)}%` }}
              className={cn(
                'relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden border-r border-bg font-display text-[15px] font-bold last:border-r-0',
                known ? COMPOUND_BG[stint.compound as TyreCompound] : 'bg-surface-3 text-ink',
                invalid && 'ring-2 ring-inset ring-danger',
              )}
            >
              {invalid && <AlertIcon className="size-3.5 flex-none" />}
              <span aria-hidden="true">
                {known ? COMPOUND_LETTER[stint.compound as TyreCompound] : '?'}
              </span>
              <span className="font-mono text-caption tabular-nums">{stint.laps}</span>
              <span className="sr-only">
                {t('strategy.bar.stintName', { number: index + 1, compound: name })}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="mt-1 flex justify-between font-mono text-caption tabular-nums text-ink-faint">
        <span>{`${lapPrefix}1`}</span>
        <span>{`${lapPrefix}${raceLaps}`}</span>
      </div>
    </div>
  )
}
