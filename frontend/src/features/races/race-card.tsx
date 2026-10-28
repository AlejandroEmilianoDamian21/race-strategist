import { useTranslation } from 'react-i18next'
import type { RaceListItem } from '@/shared/api/types'
import { CheckIcon, RainIcon } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/cn'
import { formatDate, formatPercent } from './format'

interface RaceCardProps {
  race: RaceListItem
  selected: boolean
  onSelect: (id: string) => void
}

export function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  const { t, i18n } = useTranslation()
  const type = t(`circuitTypes.${race.circuit.type}`, { defaultValue: race.circuit.type })
  const wet = race.rainProbability >= 0.5

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(race.id)}
      className={cn(
        'relative flex min-h-28 w-full cursor-pointer flex-col gap-1 rounded-md border border-line',
        'bg-surface-1 p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2',
        'focus-visible:outline-none focus-visible:shadow-focus',
        'aria-pressed:border-accent aria-pressed:shadow-[inset_0_3px_0_var(--color-accent)]',
      )}
    >
      <span className="flex items-center justify-between font-mono text-caption">
        <span className="text-ink-faint">R{String(race.round).padStart(2, '0')}</span>
        <span className="text-ink-muted">{formatDate(race.date, i18n.language)}</span>
      </span>
      <span className="mt-2 font-display text-[19px] font-bold uppercase leading-[22px]">
        {race.name}
      </span>
      <span className="text-label text-ink-muted">
        {`${race.circuit.country} · ${type.toLowerCase()} · ${t('races.lapsShort', { count: race.laps })}`}
      </span>
      <span className="mt-auto flex gap-3 pt-2 font-mono text-caption text-ink-muted">
        <span>{`${race.temperature}°C`}</span>
        <span className={cn('inline-flex items-center gap-1', wet && 'text-rain')}>
          <RainIcon className="size-[13px]" />
          {t('races.rain', { percent: formatPercent(race.rainProbability) })}
        </span>
      </span>
      {selected && <CheckIcon className="absolute top-3 right-3 size-5 text-accent-text" />}
    </button>
  )
}
