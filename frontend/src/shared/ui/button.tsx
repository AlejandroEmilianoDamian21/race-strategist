import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ClockIcon } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

interface CommonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
  loadingText?: string
  progress?: number
}

type ButtonProps = CommonProps &
  ({ disabled?: false; hint?: never } | { disabled: true; hint: string })

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-transparent text-ink border-line-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-muted px-3 hover:text-ink hover:bg-surface-2',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-6 text-[17px]',
  lg: 'h-13 px-8 text-[20px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  loadingText,
  progress = 0,
  disabled = false,
  hint,
  className,
  children,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const hintId = useId()
  const inactive = disabled || loading

  const button = (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      aria-describedby={disabled ? hintId : rest['aria-describedby']}
      onClick={inactive ? undefined : onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap',
        'border border-transparent rounded-sm font-display font-bold uppercase tracking-wider',
        'transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:bg-surface-2 disabled:text-ink-faint disabled:border-line disabled:cursor-not-allowed',
        '[&_svg]:size-[18px] [&_svg]:flex-none',
        VARIANTS[variant],
        SIZES[size],
        loading && 'bg-accent text-on-accent cursor-progress hover:bg-accent',
        className,
      )}
    >
      {loading ? <ClockIcon /> : icon}
      {loading ? (loadingText ?? children) : children}
      {loading && (
        <span
          className="absolute left-0 bottom-0 h-[3px] bg-on-accent/85"
          style={{
            width: `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`,
          }}
        />
      )}
    </button>
  )

  if (!disabled) return button

  return (
    <div className="flex flex-wrap items-center gap-3">
      {button}
      <span id={hintId} className="text-label text-ink-muted">
        {hint}
      </span>
    </div>
  )
}
