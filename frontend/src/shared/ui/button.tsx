import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ClockIcon, ErrorIcon } from './icons'

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
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2',
}

const SIZES: Record<Size, string> = {
  md: 'h-11',
  lg: 'h-13',
}

const PADDING: Record<Size, string> = {
  md: 'px-6',
  lg: 'px-8',
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
        'border border-transparent rounded-sm body uppercase tracking-[1px]',
        'transition-colors cursor-pointer focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:bg-surface-2 disabled:text-ink-faint disabled:border-line disabled:cursor-not-allowed',
        '[&_svg]:size-[18px] [&_svg]:flex-none',
        VARIANTS[variant],
        SIZES[size],
        variant === 'ghost' ? 'px-3' : PADDING[size],
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
      <span id={hintId} className="flex items-center gap-1 text-[13px] text-ink-muted">
        <ErrorIcon className="size-4 flex-none text-danger" />
        {hint}
      </span>
    </div>
  )
}
