import { Trans, useTranslation } from 'react-i18next'
import type { Tyre, WeatherSegment } from '@/shared/api/types'
import { TYRE_COMPOUNDS } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { toPercent } from '@/shared/lib/to-percent'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { TyreChip } from '@/shared/ui/compound-badge'
import { formatSignedSeconds } from './format'
import { fitsAnySegment, rainMarks } from './ideal-compounds'

const DEGRADATION_SCALE = 0.13

const RANGE_COLOR = {
  SOFT: 'bg-tyre-soft',
  MEDIUM: 'bg-tyre-medium',
  HARD: 'bg-tyre-hard',
  INTERMEDIATE: 'bg-tyre-inter',
  WET: 'bg-tyre-wet',
} as const

interface TyreCompoundsProps {
  tyres: Tyre[]
  tyreWear: number
  forecast: WeatherSegment[]
}

export function TyreCompounds({ tyres, tyreWear, forecast }: TyreCompoundsProps) {
  const { t } = useTranslation()
  const ordered = [...tyres].sort(
    (a, b) => TYRE_COMPOUNDS.indexOf(a.compound) - TYRE_COMPOUNDS.indexOf(b.compound),
  )
  const marks = rainMarks(forecast)

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('raceInfo.tyres.title')}</CardTitle>
        <span className="text-caption text-ink-faint">
          {t('raceInfo.tyres.count', { count: tyres.length })}
        </span>
      </CardHead>
      <ul className="m-0 grid list-none gap-0 p-0">
        {ordered.map((tyre) => {
          const fits = fitsAnySegment(tyre, forecast)
          const { min, max } = tyre.optimalRainIntensity
          const degradation = tyre.degradation * tyreWear
          const degradationLabel = t('raceInfo.tyres.degradation')
          return (
            <li
              key={tyre.compound}
              data-dimmed={fits ? undefined : 'true'}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-line py-3',
                'first:border-t-0 first:pt-0',
                !fits && 'opacity-45',
              )}
            >
              <TyreChip compound={tyre.compound} />
              <span className="self-center font-mono text-data font-semibold leading-[inherit] tabular-nums">
                {formatSignedSeconds(tyre.pace)}
              </span>
              <div className="col-span-full grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <div className="flex justify-between text-caption leading-[inherit] text-ink-faint">
                    <span>{degradationLabel}</span>
                    <span className="font-mono tabular-nums">
                      {`${formatSignedSeconds(degradation, 3)}/v`}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={degradationLabel}
                    aria-valuemin={0}
                    aria-valuemax={DEGRADATION_SCALE}
                    aria-valuenow={Number(degradation.toFixed(3))}
                    className="h-1.5 w-full overflow-hidden rounded-[1px] bg-surface-3"
                  >
                    <div
                      className="h-full bg-warning"
                      style={{ width: `${toPercent(degradation, DEGRADATION_SCALE)}%` }}
                    />
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="flex justify-between text-caption leading-[inherit] text-ink-faint">
                    <span>{t('raceInfo.tyres.optimalRain')}</span>
                    <span className="font-mono tabular-nums">{`${min}–${max}`}</span>
                  </div>
                  <div
                    role="img"
                    aria-label={t('raceInfo.tyres.optimalRange', { min, max })}
                    className="relative mt-0.5 h-1.5 rounded-[1px] bg-surface-3"
                  >
                    <i
                      className={cn('absolute inset-y-0', RANGE_COLOR[tyre.compound])}
                      style={{
                        left: `${min * 100}%`,
                        width: `${Math.max(2, (max - min) * 100)}%`,
                      }}
                    />
                    {marks.map((mark) => (
                      <b
                        key={mark}
                        title={t('raceInfo.tyres.mark', { value: mark })}
                        className="absolute -inset-y-1 -ml-px w-0.5 bg-rain"
                        style={{ left: `${mark * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="m-0 mt-3 text-caption text-ink-faint">
        <Trans
          i18nKey="raceInfo.tyres.noteRich"
          values={{ wear: tyreWear }}
          components={{ code: <code className="font-mono text-[0.88em] text-ink" /> }}
        />
      </p>
    </Card>
  )
}
