import { cn } from '@/shared/lib/cn'
import { toPercent } from '@/shared/lib/to-percent'

interface MeterProps {
  label: string
  value: number
  max: number
  display: string
  note: string
  tone?: 'ink' | 'warning'
}

export function Meter({ label, value, max, display, note, tone = 'ink' }: MeterProps) {
  const percent = Math.max(3, toPercent(value, max))

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-label font-semibold leading-[inherit] text-ink-muted">
        <span>{label}</span>
        <b className="font-mono font-black tabular-nums text-ink">{display}</b>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-1.5 w-full overflow-hidden rounded-[1px] bg-surface-3"
      >
        <div
          className={cn('h-full', tone === 'warning' ? 'bg-warning' : 'bg-ink')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-caption text-ink-faint">{note}</span>
    </div>
  )
}
