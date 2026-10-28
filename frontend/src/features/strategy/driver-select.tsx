import type { ChangeEvent } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceOverviewTeam } from '@/shared/api/types'
import { INPUT_CLASS } from './controls'

interface DriverSelectProps {
  teams: RaceOverviewTeam[]
  driverId: string | null
  onSelect: (driverId: string) => void
}

export function DriverSelect({ teams, driverId, onSelect }: DriverSelectProps) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <div className="grid w-[280px] gap-0.5 max-[720px]:w-full">
      <label htmlFor={id} className="text-caption leading-[22px]">
        {t('strategy.driver.label')}
      </label>
      <select
        id={id}
        value={driverId ?? ''}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onSelect(event.target.value)}
        className={INPUT_CLASS}
      >
        {driverId === null && <option value="">{t('strategy.driver.placeholder')}</option>}
        {teams.map((team) => (
          <optgroup key={team.id} label={team.name}>
            {team.drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {`#${driver.number} ${driver.name}`}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
