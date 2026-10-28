import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { teamColor } from '@/features/races/team-colors'
import { FlagIcon, WrenchIcon } from '@/shared/ui/icons'

interface FactDriver {
  teamName: string
  carPerformance: number
  pace: number
}

interface StrategyFactsProps {
  pitStopLoss: number
  tyreChangeTime: number
  minimumPitStops: number
  driver: FactDriver | null
}

const BOLD = { b: <b className="font-mono text-ink" /> }

export function Fact({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface-2 px-3 py-1 text-[13px] font-normal leading-[22px] text-ink-muted max-[720px]:whitespace-normal [&_svg]:size-3.5">
      {children}
    </span>
  )
}

export function StrategyFacts({
  pitStopLoss,
  tyreChangeTime,
  minimumPitStops,
  driver,
}: StrategyFactsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap gap-2">
      {driver !== null && (
        <Fact>
          <i
            aria-hidden="true"
            style={{ background: teamColor(driver.teamName) }}
            className="inline-block h-3.5 w-1"
          />
          {t('strategy.facts.team', {
            team: driver.teamName,
            car: driver.carPerformance,
            pace: driver.pace,
          })}
        </Fact>
      )}
      <Fact>
        <WrenchIcon />
        <Trans
          i18nKey="strategy.facts.pit"
          values={{
            loss: pitStopLoss,
            change: tyreChangeTime,
            total: (pitStopLoss + tyreChangeTime).toFixed(1),
          }}
          components={BOLD}
        />
      </Fact>
      <Fact>
        <FlagIcon />
        <Trans i18nKey="strategy.facts.minStops" count={minimumPitStops} components={BOLD} />
      </Fact>
    </div>
  )
}
