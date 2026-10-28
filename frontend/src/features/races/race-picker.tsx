import { useTranslation } from 'react-i18next'
import type { RaceListItem } from '@/shared/api/types'
import { Skeleton } from '@/shared/ui/skeleton'
import { RaceCard } from './race-card'

const GRID =
  'm-0 grid list-none grid-cols-4 gap-3 p-0 max-[1100px]:grid-cols-3 ' +
  'max-[720px]:-mx-4 max-[720px]:flex max-[720px]:snap-x max-[720px]:snap-mandatory ' +
  'max-[720px]:overflow-x-auto max-[720px]:px-4 max-[720px]:pb-2'
const CELL = 'flex min-w-0 max-[720px]:flex-none max-[720px]:basis-[72%] max-[720px]:snap-start'

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

const SKELETON_COUNT = 7

export function RacePickerSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" aria-busy="true" aria-label={t('races.loading')} className={GRID}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          data-skeleton-card
          aria-hidden="true"
          className={`${CELL} min-h-28 flex-col gap-1 rounded-md border border-line bg-surface-1 p-4`}
        >
          <Skeleton className="h-[12px] w-2/5" />
          <Skeleton className="mt-[14px] h-5 w-4/5" />
          <Skeleton className="mt-2 h-[12px] w-3/5" />
        </div>
      ))}
    </div>
  )
}
