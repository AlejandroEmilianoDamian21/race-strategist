import { useTranslation } from 'react-i18next'
import type { TyreCompound } from '@/shared/api/types'
import { cn } from '@/shared/lib/cn'
import { COMPOUND_LETTER } from './compound-letter'

const COMPOUND_COLOR: Record<TyreCompound, string> = {
  SOFT: 'border-tyre-soft text-tyre-soft',
  MEDIUM: 'border-tyre-medium text-tyre-medium',
  HARD: 'border-tyre-hard text-tyre-hard',
  INTERMEDIATE: 'border-tyre-inter text-tyre-inter',
  WET: 'border-tyre-wet text-tyre-wet',
}

interface CompoundBadgeProps {
  compound: TyreCompound
  showName?: boolean
  className?: string
}

export function CompoundBadge({ compound, showName = false, className }: CompoundBadgeProps) {
  const { t } = useTranslation()
  const name = t(`compounds.${compound}`)

  const circle = (
    <span
      role={showName ? undefined : 'img'}
      aria-label={showName ? undefined : name}
      aria-hidden={showName ? true : undefined}
      className={cn(
        'inline-grid size-7 flex-none place-items-center rounded-full border-[3px] bg-bg',
        'font-display text-[14px] font-bold leading-none',
        COMPOUND_COLOR[compound],
        !showName && className,
      )}
    >
      {COMPOUND_LETTER[compound]}
    </span>
  )

  if (!showName) return circle

  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      {circle}
      <span>{name}</span>
    </span>
  )
}
