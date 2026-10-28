import { useTranslation } from 'react-i18next'
import { StintBar } from '@/features/strategy/stint-bar'
import type { RaceOverview, SimulationResult, Stint, TyreCompound } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'

interface StintTimelineProps {
  result: SimulationResult
  previous: SimulationResult | null
  overview: RaceOverview
}

function toStints(result: SimulationResult): Stint[] {
  return result.stints.map((stint) => ({ compound: stint.compound, laps: stint.laps }))
}

export function StintTimeline({ result, previous, overview }: StintTimelineProps) {
  const { t } = useTranslation()
  const ghost = previous === null ? undefined : toStints(previous)

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('result.timeline.title')}</CardTitle>
        {ghost !== undefined && (
          <span className="text-caption text-ink-faint">
            {t('result.timeline.previousNote', {
              summary: ghost
                .map((stint) => t(compoundNameKey(stint.compound as TyreCompound)))
                .join(' → '),
            })}
          </span>
        )}
      </CardHead>
      <StintBar
        stints={toStints(result)}
        raceLaps={overview.race.laps}
        forecast={overview.weather.forecast}
        tyres={overview.tyres}
        result={{ stints: result.stints, pitStops: result.pitStops }}
        ghost={ghost}
      />
    </Card>
  )
}
