import { useTranslation } from 'react-i18next'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { Card } from '@/shared/ui/card'
import { QueryStateGate } from '@/shared/ui/query-state-gate'
import { SectionHead } from '@/shared/ui/section-head'
import { Skeleton } from '@/shared/ui/skeleton'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { CircuitCard } from './circuit-card'
import { DriverGrid } from './driver-grid'
import { formatRaceDate } from './format'
import { raceOverviewKey, useRaceOverview } from './use-race-overview'
import { TyreCompounds } from './tyre-compounds'
import { WeatherTimeline } from './weather-timeline'

interface RaceInfoStepProps {
  raceId: string | null
  driverId: string | null
  onSelectDriver: (id: string) => void
}

function scrollToCalendar() {
  document.getElementById('step-race')?.scrollIntoView({ behavior: 'smooth' })
}

export function RaceInfoStep({ raceId, driverId, onSelectDriver }: RaceInfoStepProps) {
  const { t, i18n } = useTranslation()
  const { status, retry } = useQueryStatus(useRaceOverview(raceId), raceOverviewKey(raceId))
  const race = raceId !== null && status.kind === 'success' ? status.data.race : null

  return (
    <section id="step-info" aria-labelledby="step-info-title" className="scroll-mt-24">
      <SectionHead
        step={2}
        title={race?.name ?? t('raceInfo.title')}
        titleId="step-info-title"
        right={
          race ? (
            <span className="text-caption text-ink-faint">
              {t('raceInfo.headCaption', {
                round: race.round,
                date: formatRaceDate(race.date, i18n.language),
                temperature: race.temperature,
              })}
            </span>
          ) : undefined
        }
      />
      {raceId === null ? (
        <StatusPanel variant="empty-race" />
      ) : (
        <QueryStateGate
          status={status}
          onRetry={retry}
          onBack={scrollToCalendar}
          request={{ method: 'GET', path: `/api/races/${encodeURIComponent(raceId)}/overview` }}
          loading={<RaceInfoSkeleton />}
        >
          {(overview) => (
            <div className="grid gap-6">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 max-[860px]:grid-cols-1">
                <CircuitCard
                  circuit={overview.circuit}
                  parameters={overview.parameters}
                  rainProbability={overview.race.rainProbability}
                />
                <TyreCompounds
                  tyres={overview.tyres}
                  tyreWear={overview.circuit.tyreWear}
                  forecast={overview.weather.forecast}
                />
              </div>
              <WeatherTimeline
                weather={overview.weather}
                tyres={overview.tyres}
                laps={overview.race.laps}
                rainProbability={overview.race.rainProbability}
              />
              <DriverGrid teams={overview.teams} selectedId={driverId} onSelect={onSelectDriver} />
            </div>
          )}
        </QueryStateGate>
      )}
    </section>
  )
}

function RaceInfoSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy="true" aria-label={t('raceInfo.loading')} className="grid gap-6">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 max-[860px]:grid-cols-1">
        <Card>
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="mt-3 h-6 w-2/3" />
          <Skeleton className="mt-4 h-[72px] w-full" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-4 h-16 w-full" />
        </Card>
        <Card>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="mt-4 h-48 w-full" />
        </Card>
      </div>
      <Card>
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-16 w-full" />
        <Skeleton className="mt-4 h-8 w-full" />
        <Skeleton className="mt-4 h-16 w-full" />
      </Card>
      <Card>
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>
    </div>
  )
}
