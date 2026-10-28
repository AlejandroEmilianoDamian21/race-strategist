import type { Stint, TyreCompound } from '@/shared/api/types'
import { isTyreCompound } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { COMPOUND_BG } from './compound-colors'

interface GhostBarProps {
  stints: Stint[]
  label: string
  className?: string
}

export function GhostBar({ stints, label, className }: GhostBarProps) {
  return (
    <div role="list" aria-label={label} className={cn('relative flex bg-bg', className)}>
      {stints.map((stint, index) => (
        <div
          key={index}
          role="listitem"
          style={{ flex: `${Math.max(0, stint.laps)} 1 0` }}
          className={cn(
            'min-w-0 p-0 not-first:shadow-[inset_3px_0_0_var(--bg)]',
            isTyreCompound(stint.compound)
              ? COMPOUND_BG[stint.compound as TyreCompound]
              : 'bg-surface-3',
          )}
        />
      ))}
    </div>
  )
}
