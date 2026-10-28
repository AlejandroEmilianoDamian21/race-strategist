import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppError } from '@/shared/api/app-error'
import { raceOverviewKey, useRaceOverview } from '@/features/races/use-race-overview'
import type { RaceOverview, SimulateRequest, Stint } from '@/shared/api/types'
import { useQueryStatus } from '@/shared/hooks/use-query-status'
import { Card } from '@/shared/ui/card'
import { SectionHead } from '@/shared/ui/section-head'
import { Skeleton } from '@/shared/ui/skeleton'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { DriverSelect } from './driver-select'
import { stintEnds } from './pit-lap'
import { canSplitStint } from './stop-edits'
import { SimulateBar } from './simulate-bar'
import { errorScopes } from './stint-scope'
import { StintBar } from './stint-bar'
import { StintRow } from './stint-row'
import { StrategyFacts } from './strategy-facts'
import { StrategyIssues } from './strategy-issues'
import { useStrategy } from './use-strategy'

interface StrategyStepProps {
  raceId: string | null
  driverId: string | null
  onSelectDriver: (driverId: string) => void
  onSimulate: (request: SimulateRequest) => void
  onStintsChange?: (raceId: string, stints: Stint[]) => void
  simulationProgress?: number | null
}

export function StrategyStep({
  raceId,
  driverId,
  onSelectDriver,
  onSimulate,
  onStintsChange,
  simulationProgress = null,
}: StrategyStepProps) {
  const { t } = useTranslation()
  const { status, retry } = useQueryStatus(useRaceOverview(raceId), raceOverviewKey(raceId))

  return (
    <section
      id="step-strategy"
      aria-labelledby="step-strategy-title"
      className="scroll-mt-[90px] pt-12 first:pt-0"
    >
      <SectionHead
        step={3}
        title={t('strategy.title')}
        titleId="step-strategy-title"
        right={<span className="text-caption text-ink-faint">{t('strategy.hint')}</span>}
      />
      {raceId === null ? (
        <StatusPanel variant="empty-strategy" />
      ) : status.kind === 'success' ? (
        <StrategyBuilder
          overview={status.data}
          driverId={driverId}
          onSelectDriver={onSelectDriver}
          onSimulate={onSimulate}
          onStintsChange={onStintsChange}
          simulationProgress={simulationProgress}
        />
      ) : status.kind === 'error' || status.kind === 'timed-out' ? (
        <StatusPanel
          variant="api-error"
          error={status.kind === 'error' ? status.error : timeoutError(raceId)}
          onRetry={retry}
        />
      ) : (
        <BuilderSkeleton />
      )}
    </section>
  )
}

function timeoutError(raceId: string) {
  return new AppError('timeout', {
    method: 'GET',
    path: `/api/races/${encodeURIComponent(raceId)}/overview`,
  })
}

function BuilderSkeleton() {
  const { t } = useTranslation()

  return (
    <Card role="status" aria-busy="true" aria-label={t('strategy.loading')}>
      <Skeleton className="h-9 w-70 max-w-full" />
      <Skeleton className="mt-4 h-32 w-full" />
      <Skeleton className="mt-6 h-14 w-full" />
      <Skeleton className="mt-2 h-14 w-full" />
    </Card>
  )
}

interface StrategyBuilderProps {
  overview: RaceOverview
  driverId: string | null
  onSelectDriver: (driverId: string) => void
  onSimulate: (request: SimulateRequest) => void
  onStintsChange?: (raceId: string, stints: Stint[]) => void
  simulationProgress: number | null
}

function findDriver(overview: RaceOverview, driverId: string | null) {
  for (const team of overview.teams) {
    const driver = team.drivers.find((candidate) => candidate.id === driverId)
    if (driver !== undefined) {
      return { teamName: team.name, carPerformance: team.carPerformance, pace: driver.pace }
    }
  }
  return null
}

function StrategyBuilder({
  overview,
  driverId,
  onSelectDriver,
  onSimulate,
  onStintsChange,
  simulationProgress,
}: StrategyBuilderProps) {
  const { stints, validation, setCompound, setLaps, addStop, removeStint, movePit } =
    useStrategy(overview)
  const { errors, warnings } = validation
  const driver = findDriver(overview, driverId)
  const scopes = errorScopes(errors, stints.length)
  const warningStints = new Set(warnings.map((warning) => warning.stintIndex))
  const ends = stintEnds(stints)
  const raceLaps = overview.race.laps
  const raceId = overview.race.id

  useEffect(() => {
    onStintsChange?.(raceId, stints)
  }, [onStintsChange, raceId, stints])

  function simulate() {
    if (errors.length > 0 || driver === null || driverId === null) return
    onSimulate({ raceId: overview.race.id, driverId, stints })
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <DriverSelect teams={overview.teams} driverId={driverId} onSelect={onSelectDriver} />
        <StrategyFacts
          pitStopLoss={overview.parameters.pitStopLoss}
          tyreChangeTime={overview.parameters.tyreChangeTime}
          minimumPitStops={overview.parameters.minimumPitStops}
          driver={driver}
        />
      </div>
      <StintBar
        stints={stints}
        raceLaps={raceLaps}
        forecast={overview.weather.forecast}
        tyres={overview.tyres}
        errorStints={scopes.segments}
        warningStints={warningStints}
        onMovePit={movePit}
      />
      <StrategyIssues
        errors={errors}
        warnings={warnings}
        stops={stints.length - 1}
        raceLaps={raceLaps}
      />
      <ul className="m-0 mt-6 grid list-none gap-2 p-0">
        {stints.map((stint, index) => (
          <StintRow
            key={index}
            index={index}
            stint={stint}
            end={ends[index] ?? 0}
            raceLaps={raceLaps}
            isLast={index === stints.length - 1}
            invalid={scopes.rows.has(index)}
            canRemove={stints.length > 1}
            onCompoundChange={setCompound}
            onLapsChange={setLaps}
            onPitChange={movePit}
            onRemove={removeStint}
          />
        ))}
      </ul>
      <SimulateBar
        errorCount={errors.length}
        hasDriver={driver !== null}
        raceLaps={raceLaps}
        progress={simulationProgress}
        canAddStop={canSplitStint(stints)}
        onAddStop={addStop}
        onSimulate={simulate}
      />
    </Card>
  )
}
