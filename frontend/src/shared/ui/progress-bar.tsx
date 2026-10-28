import { cn } from '@/shared/lib/cn'

interface ProgressBarProps {
  value: number
  max: number
  label: string
  tone?: 'warning' | 'accent'
  className?: string
}

export function ProgressBar({ value, max, label, tone = 'warning', className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

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
