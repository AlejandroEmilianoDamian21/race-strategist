import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceOverviewTeam } from '@/shared/api/types'
import { Card, CardTitle } from '@/shared/ui/card'
import { teamColor } from './team-colors'

interface DriverGridProps {
  teams: RaceOverviewTeam[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DriverGrid({ teams, selectedId, onSelect }: DriverGridProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-[1100px]:col-span-3">
      <CardTitle className="mb-4">{t('raceInfo.drivers.title')}</CardTitle>
      <div className="grid gap-3 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {teams.map((team) => (
          <div
            key={team.id}
            role="group"
            aria-label={team.name}
            style={{ '--team': teamColor(team.name) } as CSSProperties}
            className="rounded-sm border-t-[3px] border-t-(--team) bg-surface-2 p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-display text-[15px] font-bold uppercase tracking-[0.5px]">
                {team.name}
              </span>
              <span
                title={t('raceInfo.drivers.carPerformance')}
                className="font-mono text-caption tabular-nums text-ink-muted"
              >
                {team.carPerformance}
              </span>
            </div>
            {team.drivers.map((driver) => (
              <button
                key={driver.id}
                type="button"
                aria-pressed={driver.id === selectedId}
                onClick={() => onSelect(driver.id)}
                className="flex w-full cursor-pointer items-baseline gap-2 rounded-sm border border-transparent px-2 py-1 text-left text-data hover:bg-surface-3 focus-visible:outline-none focus-visible:shadow-focus aria-pressed:border-accent aria-pressed:bg-surface-3"
              >
                <span className="w-6 font-mono text-caption tabular-nums text-ink-faint">
                  {driver.number}
                </span>
                <span className="flex-1">{driver.name}</span>
                <span
                  title={t('raceInfo.drivers.pace')}
                  className="font-mono text-caption tabular-nums text-ink-muted"
                >
                  {driver.pace}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
