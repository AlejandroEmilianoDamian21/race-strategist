import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tyre, WeatherSegment } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import { RainIcon, SunIcon } from '@/shared/ui/icons'
import { rainLevel } from './format'
import { idealCompounds } from './ideal-compounds'

const MAX_RAIN_SHARE = 0.6
const BASE_RAIN_SHARE = 0.18
const RAIN_SHARE_SLOPE = 0.45

function rainShare(intensity: number): string {
  return Math.min(MAX_RAIN_SHARE, BASE_RAIN_SHARE + intensity * RAIN_SHARE_SLOPE).toFixed(2)
}

interface WeatherBandProps {
  forecast: WeatherSegment[]
  tyres: Tyre[]
}

export function WeatherBand({ forecast, tyres }: WeatherBandProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')

  return (
    <div role="list" aria-label={t('raceInfo.weather.band')} className="mb-1 flex h-8">
      {forecast.map((segment) => {
        const wet = segment.rainIntensity > 0
        const ideal = idealCompounds(tyres, segment.rainIntensity)
        const Icon = wet ? RainIcon : SunIcon
        const label = t('raceInfo.weather.segmentLabel', {
          from: `${lap}${segment.fromLap}`,
          to: `${lap}${segment.toLap}`,
          level: t(`raceInfo.weather.${rainLevel(segment.rainIntensity)}`),
          value: segment.rainIntensity,
          temperature: segment.temperature,
          ideal:
            ideal.length > 0
              ? t('raceInfo.weather.idealLabel', {
                  compounds: ideal.map((compound) => t(compoundNameKey(compound))).join(', '),
                })
              : '',
        })
        return (
          <div
            key={`${segment.fromLap}-${segment.toLap}`}
            role="listitem"
            aria-label={label}
            title={label}
            data-wet={wet ? 'true' : undefined}
            style={
              {
                flex: `${segment.toLap - segment.fromLap + 1} 1 0`,
                ...(wet ? { '--a': rainShare(segment.rainIntensity) } : {}),
              } as CSSProperties
            }
            className={cn(
              'flex min-w-0 items-center justify-between gap-2 overflow-hidden whitespace-nowrap px-2',
              'font-mono text-[11px] font-semibold leading-[inherit]',
              'not-first:pl-[calc(var(--space-2)+3px)] not-first:shadow-[inset_3px_0_0_var(--bg)]',
              wet
                ? 'bg-[color-mix(in_srgb,var(--rain)_calc(var(--a)*100%),var(--surface-2))] text-ink'
                : 'bg-surface-2 text-ink-muted',
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-1 overflow-hidden text-ellipsis">
              <Icon className="size-3.5 flex-none" />
              <span className="max-[720px]:hidden">
                {`${lap}${segment.fromLap}–${segment.toLap} · ${segment.temperature}° · ${
                  wet ? segment.rainIntensity : t('raceInfo.weather.dryShort')
                }`}
              </span>
            </span>
            <span aria-hidden="true" className="inline-flex flex-none gap-0.5">
              {ideal.map((compound) => (
                <CompoundBadge key={compound} compound={compound} size="sm" decorative />
              ))}
            </span>
          </div>
        )
      })}
    </div>
  )
}
