import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

interface ChipDriver {
  name: string
  teamName: string
  carPerformance: number
  pace: number
}

interface StrategyChipsProps {
  totalLaps: number
  raceLaps: number
  pitStopLoss: number
  tyreChangeTime: number
  minimumPitStops: number
  driver: ChipDriver | null
}

function Chip({ invalid = false, children }: { invalid?: boolean; children: ReactNode }) {
  return (
    <li
      data-invalid={invalid ? 'true' : undefined}
      className={cn(
        'rounded-sm border px-2 py-1 font-mono text-caption tabular-nums',
        invalid ? 'border-danger text-danger' : 'border-line bg-surface-2 text-ink-muted',
      )}
    >
      {children}
    </li>
  )
}

export function StrategyChips({
  totalLaps,
  raceLaps,
  pitStopLoss,
  tyreChangeTime,
  minimumPitStops,
  driver,
}: StrategyChipsProps) {
  const { t } = useTranslation()

  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      <Chip invalid={totalLaps !== raceLaps}>
        {t('strategy.chips.laps', { total: totalLaps, expected: raceLaps })}
      </Chip>
      <Chip>{t('strategy.chips.pit', { pitStopLoss, tyreChangeTime })}</Chip>
      <Chip>{t('strategy.chips.minStops', { count: minimumPitStops })}</Chip>
      {driver === null ? (
        <Chip>{t('strategy.chips.noDriver')}</Chip>
      ) : (
        <>
          <Chip>{t('strategy.chips.driver', { name: driver.name, team: driver.teamName })}</Chip>
          <Chip>
            {t('strategy.chips.performance', { car: driver.carPerformance, pace: driver.pace })}
          </Chip>
        </>
      )}
    </ul>
  )
}
