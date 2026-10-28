import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceOverviewTeam } from '@/shared/api/types'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { CarIcon } from '@/shared/ui/icons'
import { teamColor } from './team-colors'

interface DriverGridProps {
  teams: RaceOverviewTeam[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DriverGrid({ teams, selectedId, onSelect }: DriverGridProps) {
  const { t } = useTranslation()
  const drivers = teams.reduce((total, team) => total + team.drivers.length, 0)

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('raceInfo.drivers.title')}</CardTitle>
        <span className="text-caption text-ink-faint">
          {t('raceInfo.drivers.caption', { drivers, teams: teams.length })}
        </span>
      </CardHead>
      <div className="grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team.id}
            role="group"
            aria-label={team.name}
            style={{ '--team': teamColor(team.name) } as CSSProperties}
            className="rounded-sm border-t-[3px] border-t-(--team) bg-surface-2 p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-display text-[15px] font-bold uppercase leading-[inherit] tracking-[0.5px]">
                {team.name}
              </span>
              <span
                title={t('raceInfo.drivers.carPerformance')}
                className="inline-flex items-center gap-1 font-mono text-caption leading-[inherit] text-ink-muted"
              >
                <CarIcon className="size-3.5" />
                {team.carPerformance}
              </span>
            </div>
            {team.drivers.map((driver) => (
              <button
                key={driver.id}
                type="button"
                aria-pressed={driver.id === selectedId}
                onClick={() => onSelect(driver.id)}
                className="-mx-1 grid w-[calc(100%+8px)] cursor-pointer grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-2 rounded-sm border border-transparent bg-transparent px-1 py-px text-left text-body hover:bg-surface-3 aria-pressed:border-ink aria-pressed:bg-bg"
              >
                <span className="font-mono text-caption leading-[inherit] tabular-nums text-ink-faint">
                  {driver.number}
                </span>
                <span className="truncate">{driver.name}</span>
                <span
                  title={t('raceInfo.drivers.paceTitle', {
                    pace: driver.pace,
                    consistency: driver.consistency,
                  })}
                  className="font-mono text-caption leading-[inherit] text-ink-faint"
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
