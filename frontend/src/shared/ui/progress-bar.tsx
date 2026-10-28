import { cn } from '@/shared/lib/cn'
import { toPercent } from '@/shared/lib/to-percent'

interface ProgressBarProps {
  value: number
  max: number
  label: string
  tone?: 'warning' | 'accent'
  maxPercent?: number
  className?: string
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'warning',
  maxPercent = 100,
  className,
}: ProgressBarProps) {
  const percent = Math.min(maxPercent, toPercent(value, max))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-1.5 overflow-hidden rounded-[3px] bg-bg', className)}
    >
      <div
        className={cn(
          'h-full rounded-[3px] transition-[width] duration-400',
          tone === 'warning' ? 'bg-warning' : 'bg-accent',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
