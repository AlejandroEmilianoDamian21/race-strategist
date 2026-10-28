import { useTranslation } from 'react-i18next'
import type { RaceOverview } from '@/shared/api/types'
import { cn } from '@/shared/lib/cn'
import { Card, CardTitle } from '@/shared/ui/card'
import { RainIcon } from '@/shared/ui/icons'
import { rainLevel } from './format'

interface WeatherTimelineProps {
  weather: RaceOverview['weather']
}

export function WeatherTimeline({ weather }: WeatherTimelineProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-[1100px]:col-span-3">
      <CardTitle className="mb-4">{t('raceInfo.weather.title')}</CardTitle>
      <blockquote
        lang="en"
        className="m-0 border-l-2 border-line-strong pl-4 text-body-lg text-ink"
      >
        {`“${weather.summary}”`}
      </blockquote>
      <ul className="m-0 mt-4 grid list-none gap-3 p-0 min-[720px]:grid-cols-3">
        {weather.forecast.map((segment) => {
          const wet = segment.rainIntensity > 0
          return (
            <li
              key={`${segment.fromLap}-${segment.toLap}`}
              className={cn(
                'flex gap-3 rounded-sm border bg-surface-2 p-3',
                wet ? 'border-rain' : 'border-line',
              )}
            >
              <RainIcon
                className={cn('mt-0.5 size-5 flex-none', wet ? 'text-rain' : 'text-warning')}
              />
              <div>
                <p className="font-mono text-data font-semibold tabular-nums">
                  {`V${segment.fromLap}–V${segment.toLap}`}
                </p>
                <p className="text-label">
                  {t(`raceInfo.weather.${rainLevel(segment.rainIntensity)}`)}
                </p>
                <p className="font-mono text-caption tabular-nums text-ink-muted">
                  {`${segment.temperature}°C · ${t('raceInfo.weather.intensity', { value: segment.rainIntensity })}`}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
