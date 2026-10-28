import { useTranslation } from 'react-i18next'
import type { RaceOverview, Tyre } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { RainIcon, SunIcon } from '@/shared/ui/icons'
import { formatPercent, rainLevel } from './format'
import { idealCompounds } from './ideal-compounds'
import { LapAxis } from './lap-axis'
import { WeatherBand } from './weather-band'

interface WeatherTimelineProps {
  weather: RaceOverview['weather']
  tyres: Tyre[]
  laps: number
  rainProbability: number
}

export function WeatherTimeline({ weather, tyres, laps, rainProbability }: WeatherTimelineProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('raceInfo.weather.title')}</CardTitle>
        <span className="text-caption text-ink-faint">
          {t('raceInfo.weather.caption', { percent: formatPercent(rainProbability) })}
        </span>
      </CardHead>
      <blockquote lang="en" className="m-0 text-[17px] italic leading-6 text-ink">
        {`“${weather.summary}”`}
      </blockquote>
      <div className="mt-4 mb-2 flex justify-between">
        <span className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
          {t('raceInfo.weather.segments')}
        </span>
      </div>
      <WeatherBand forecast={weather.forecast} tyres={tyres} />
      <LapAxis total={laps} />
      <div className="mt-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {weather.forecast.map((segment) => {
          const wet = segment.rainIntensity > 0
          const Icon = wet ? RainIcon : SunIcon
          const ideal = idealCompounds(tyres, segment.rainIntensity)
          return (
            <div
              key={`${segment.fromLap}-${segment.toLap}`}
              data-testid="weather-card"
              className={cn(
                'flex items-center gap-3 rounded-sm bg-surface-2 p-3',
                wet && 'outline-1 outline-rain',
              )}
            >
              <span className={cn('flex-none', wet ? 'text-rain' : 'text-warning')}>
                <Icon className="size-[22px]" />
              </span>
              <div>
                <b className="font-mono font-semibold">{`${lap}${segment.fromLap}–${lap}${segment.toLap}`}</b>
                {` · ${t(`raceInfo.weather.${rainLevel(segment.rainIntensity)}`)}`}
                <div className="text-caption text-ink-faint">
                  {t('raceInfo.weather.detail', {
                    temperature: segment.temperature,
                    value: segment.rainIntensity,
                  })}
                  {ideal.length > 0 &&
                    t('raceInfo.weather.idealDetail', {
                      compounds: ideal.map((compound) => t(compoundNameKey(compound))).join(', '),
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
