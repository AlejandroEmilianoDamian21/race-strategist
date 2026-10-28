import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      {...rest}
      className={cn('animate-pulse rounded-sm bg-surface-2', className)}
    />
  )
}
