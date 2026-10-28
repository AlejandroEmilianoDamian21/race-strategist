import { useTranslation } from 'react-i18next'
import type { TyreCompound } from '@/shared/api/types'
import { cn } from '@/shared/lib/cn'
import { compoundLetter, compoundNameKey } from '@/shared/domain/compounds'

type BadgeSize = 'sm' | 'base' | 'lg'

const COMPOUND_COLOR: Record<TyreCompound, string> = {
  SOFT: 'border-tyre-soft text-tyre-soft',
  MEDIUM: 'border-tyre-medium text-tyre-medium',
  HARD: 'border-tyre-hard text-tyre-hard',
  INTERMEDIATE: 'border-tyre-inter text-tyre-inter',
  WET: 'border-tyre-wet text-tyre-wet',
}

const SIZES: Record<BadgeSize, string> = {
  sm: 'size-5 border-2 text-[11px]',
  base: 'size-7 border-[3px] text-[15px]',
  lg: 'size-11 border-[5px] text-[22px]',
}

interface CompoundBadgeProps {
  compound: TyreCompound
  size?: BadgeSize
  decorative?: boolean
  className?: string
}

export function CompoundBadge({
  compound,
  size = 'base',
  decorative = false,
  className,
}: CompoundBadgeProps) {
  const { t } = useTranslation()
  const name = t(compoundNameKey(compound))

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        'inline-grid flex-none place-items-center rounded-full bg-bg',
        'font-display font-extrabold',
        SIZES[size],
        'leading-none',
        COMPOUND_COLOR[compound],
        className,
      )}
    >
      {compoundLetter(compound)}
    </span>
  )
}

interface TyreChipProps {
  compound: TyreCompound
  size?: BadgeSize
  className?: string
}

export function TyreChip({ compound, size, className }: TyreChipProps) {
  const { t } = useTranslation()

  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <CompoundBadge compound={compound} size={size} decorative />
      <span>{t(compoundNameKey(compound))}</span>
    </span>
  )
}
