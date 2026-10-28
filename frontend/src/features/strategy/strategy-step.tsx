import { useTranslation } from 'react-i18next'
import { useRaceOverview } from '@/features/races/use-race-overview'
import type { RaceOverview, SimulateRequest } from '@/shared/api/types'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { PlusIcon } from '@/shared/ui/icons'
import { SectionHead } from '@/shared/ui/section-head'
import { SimulateBar } from './simulate-bar'
import { StintBar } from './stint-bar'
import { StintRow } from './stint-row'
import { StrategyChips } from './strategy-chips'
import { StrategyFeedback } from './strategy-feedback'
import { useStrategy } from './use-strategy'

interface StrategyStepProps {
  raceId: string | null
  driverId: string | null
  onSimulate: (request: SimulateRequest) => void
}

export function StrategyStep({ raceId, driverId, onSimulate }: StrategyStepProps) {
  const { t } = useTranslation()
  const overview = useRaceOverview(raceId).data

  return (
    <section aria-labelledby="step-strategy-title" className="scroll-mt-24 max-[719px]:pb-24">
      <SectionHead
        step={3}
        title={t('strategy.title')}
        titleId="step-strategy-title"
        right={
          overview === undefined ? undefined : (
            <span className="text-caption text-ink-muted">{t('strategy.hint')}</span>
          )
        }
      />
      {overview === undefined ? (
        <p className="rounded-md border border-dashed border-line-strong p-4 text-body text-ink-muted min-[720px]:p-6">
          {raceId === null ? t('strategy.empty') : t('strategy.waiting')}
        </p>
      ) : (
        <StrategyBuilder overview={overview} driverId={driverId} onSimulate={onSimulate} />
      )}
    </section>
  )
}

interface StrategyBuilderProps {
  overview: RaceOverview
  driverId: string | null
  onSimulate: (request: SimulateRequest) => void
}

function findDriver(overview: RaceOverview, driverId: string | null) {
  for (const team of overview.teams) {
    const driver = team.drivers.find((candidate) => candidate.id === driverId)
    if (driver !== undefined) {
      return {
        name: driver.name,
        teamName: team.name,
        carPerformance: team.carPerformance,
        pace: driver.pace,
      }
    }
  }
  return null
}

function StrategyBuilder({ overview, driverId, onSimulate }: StrategyBuilderProps) {
  const { t } = useTranslation()
  const { stints, validation, setCompound, setLaps, addStint, removeStint } = useStrategy(overview)
  const { errors, warnings } = validation
  const driver = findDriver(overview, driverId)
  const invalidStints = new Set(
    errors.flatMap((error) => {
      const match = /^stints\[(\d+)\]/.exec(error.field ?? '')
      return match === null ? [] : [Number(match[1])]
    }),
  )
  const totalLaps = stints.reduce(
    (sum, stint) => sum + (Number.isFinite(stint.laps) ? stint.laps : 0),
    0,
  )

  function simulate() {
    if (errors.length > 0 || driver === null || driverId === null) return
    onSimulate({ raceId: overview.race.id, driverId, stints })
  }

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4">
        <StintBar
          stints={stints}
          raceLaps={overview.race.laps}
          forecast={overview.weather.forecast}
          invalidStints={invalidStints}
        />
        <StrategyFeedback errors={errors} warnings={warnings} />
        <StrategyChips
          totalLaps={totalLaps}
          raceLaps={overview.race.laps}
          pitStopLoss={overview.parameters.pitStopLoss}
          tyreChangeTime={overview.parameters.tyreChangeTime}
          minimumPitStops={overview.parameters.minimumPitStops}
          driver={driver}
        />
        <ul aria-label={t('strategy.stints.title')} className="m-0 grid list-none gap-2 p-0">
          {stints.map((stint, index) => (
            <StintRow
              key={index}
              index={index}
              stint={stint}
              errors={errors.filter((error) => error.field?.startsWith(`stints[${index}]`))}
              canRemove={stints.length > 1}
              onCompoundChange={setCompound}
              onLapsChange={setLaps}
              onRemove={removeStint}
            />
          ))}
        </ul>
        <div>
          <Button variant="secondary" icon={<PlusIcon />} onClick={addStint}>
            {t('strategy.stints.add')}
          </Button>
        </div>
      </Card>
      <SimulateBar errorCount={errors.length} hasDriver={driver !== null} onSimulate={simulate} />
    </div>
  )
}
