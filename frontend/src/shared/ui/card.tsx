import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  cut?: boolean
}

export function Card({ cut = false, className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'bg-surface-1 border border-line rounded-md p-4 min-[720px]:p-6',
        cut && '[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)]',
        className,
      )}
    />
  )
}

export function CardHead({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn('flex flex-wrap items-baseline justify-between gap-4 mb-4', className)}
    />
  )
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cn('font-display text-heading-2 font-bold uppercase tracking-[0.5px]', className)}
    />
  )
}
