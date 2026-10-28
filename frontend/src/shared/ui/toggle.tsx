import type { ReactNode } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}

export function Toggle({ checked, onChange, children }: ToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={
          'relative m-0 h-5 w-[34px] cursor-pointer appearance-none rounded-[10px] bg-surface-3 checked:bg-series-previous ' +
          'after:absolute after:left-[3px] after:top-[3px] after:size-3.5 after:rounded-full after:bg-ink-muted after:transition-[left] after:duration-150 after:content-[""] ' +
          'checked:after:left-[17px] checked:after:bg-ink'
        }
      />
      {children}
    </label>
  )
}
