import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Tone = 'wake' | 'error' | 'empty'

interface StatusFrameProps {
  tone: Tone
  role?: 'status' | 'alert'
  icon: ReactNode
  title: string
  children?: ReactNode
}

const FRAME: Record<Tone, string> = {
  wake: 'bg-warning-surface border-warning',
  error: 'bg-danger-surface border-danger',
  empty: 'bg-transparent border-dashed border-line-strong',
}

const ICON: Record<Tone, string> = {
  wake: 'bg-bg text-warning',
  error: 'bg-bg text-danger',
  empty: 'bg-surface-2 text-ink-muted',
}

export function StatusFrame({ tone, role, icon, title, children }: StatusFrameProps) {
  return (
    <div
      role={role}
      aria-live={role === 'alert' ? 'assertive' : role === 'status' ? 'polite' : undefined}
      className={cn(
        'grid grid-cols-[40px_1fr] gap-4 rounded-md border p-6 max-[720px]:grid-cols-1 max-[720px]:p-4',
        FRAME[tone],
      )}
    >
      <div
        className={cn('grid size-10 place-items-center rounded-sm [&_svg]:size-[22px]', ICON[tone])}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="heading-2">{title}</h3>
        {children}
      </div>
    </div>
  )
}
