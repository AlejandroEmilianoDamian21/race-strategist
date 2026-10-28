import { useTranslation } from 'react-i18next'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { Card } from '@/shared/ui/card'
import { QueryStateGate } from '@/shared/ui/query-state-gate'
import { SectionHead } from '@/shared/ui/section-head'
import { Skeleton } from '@/shared/ui/skeleton'
import { CircuitCard } from './circuit-card'
import { DriverGrid } from './driver-grid'
import { raceOverviewKey, useRaceOverview } from './use-race-overview'
import { TyreCompounds } from './tyre-compounds'
import { WeatherTimeline } from './weather-timeline'

interface RaceInfoStepProps {
  raceId: string | null
  driverId: string | null
  onSelectDriver: (id: string) => void
}

export function RaceInfoStep({ raceId, driverId, onSelectDriver }: RaceInfoStepProps) {
  const { t } = useTranslation()

  return (
    <section id="step-info" aria-labelledby="step-info-title" className="scroll-mt-24">
      <SectionHead step={2} title={t('raceInfo.title')} titleId="step-info-title" />
      {raceId === null ? (
        <p className="rounded-md border border-dashed border-line-strong p-4 text-body text-ink-muted min-[720px]:p-6">
          {t('raceInfo.empty')}
        </p>
      ) : (
        <RaceOverviewCards raceId={raceId} driverId={driverId} onSelectDriver={onSelectDriver} />
      )}
    </section>
  )
}

function scrollToCalendar() {
  document.getElementById('step-race')?.scrollIntoView({ behavior: 'smooth' })
}

function RaceOverviewCards({
  raceId,
  driverId,
  onSelectDriver,
}: RaceInfoStepProps & { raceId: string }) {
  const { status, retry } = useQueryStatus(useRaceOverview(raceId), raceOverviewKey(raceId))

  return (
    <QueryStateGate
      status={status}
      onRetry={retry}
      onBack={scrollToCalendar}
      request={{ method: 'GET', path: `/api/races/${encodeURIComponent(raceId)}/overview` }}
      loading={<RaceInfoSkeleton />}
    >
      {(overview) => (
        <div className="grid items-start gap-4 min-[1100px]:grid-cols-3">
          <CircuitCard circuit={overview.circuit} parameters={overview.parameters} />
          <TyreCompounds tyres={overview.tyres} tyreWear={overview.circuit.tyreWear} />
          <WeatherTimeline weather={overview.weather} />
          <DriverGrid teams={overview.teams} selectedId={driverId} onSelect={onSelectDriver} />
        </div>
      )}
    </QueryStateGate>
  )
}

function RaceInfoSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('raceInfo.loading')}
      className="grid gap-4 min-[1100px]:grid-cols-3"
    >
      <Card className="min-[1100px]:col-span-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-3 h-6 w-2/3" />
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-6 h-12 w-full" />
      </Card>
      <Card>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="mt-4 h-32 w-full" />
      </Card>
      <Card className="min-[1100px]:col-span-3">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-20 w-full" />
      </Card>
      <Card className="min-[1100px]:col-span-3">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="mt-4 h-32 w-full" />
      </Card>
    </div>
  )
}
