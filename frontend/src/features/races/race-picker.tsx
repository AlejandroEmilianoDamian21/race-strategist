import { useTranslation } from 'react-i18next'
import type { RaceListItem } from '@/shared/api/types'
import { Skeleton } from '@/shared/ui/skeleton'
import { RaceCard } from './race-card'

const GRID =
  'flex list-none gap-3 overflow-x-auto p-0 m-0 snap-x pb-2 min-[720px]:grid min-[720px]:grid-cols-2 ' +
  'min-[720px]:overflow-visible min-[720px]:pb-0 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4'
const CELL = 'w-60 flex-none snap-start min-[720px]:w-auto'

interface RacePickerProps {
  races: RaceListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function RacePicker({ races, selectedId, onSelect }: RacePickerProps) {
  return (
    <ul className={GRID}>
      {races.map((race) => (
        <li key={race.id} className={CELL}>
          <RaceCard race={race} selected={race.id === selectedId} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}

const SKELETON_COUNT = 8

export function RacePickerSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy="true" aria-label={t('races.loading')} className={GRID}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          data-skeleton-card
          className={`${CELL} min-h-28 rounded-md border border-line bg-surface-1 p-4`}
        >
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="mt-4 h-5 w-4/5" />
          <Skeleton className="mt-2 h-3 w-3/5" />
        </div>
      ))}
    </div>
  )
}
