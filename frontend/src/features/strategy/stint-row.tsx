import { useId, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Stint, StrategyViolation, TyreCompound } from '@/shared/api/types'
import { translateViolation } from '@/shared/i18n/translate-violation'
import { cn } from '@/shared/lib/cn'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import { CloseIcon, ErrorIcon } from '@/shared/ui/icons'
import { TYRE_COMPOUNDS, isTyreCompound } from './compounds'

const CONTROL =
  'h-11 rounded-sm border border-line-strong bg-surface-2 px-3 text-body text-ink focus-visible:outline-none focus-visible:shadow-focus aria-invalid:border-danger'

interface StintRowProps {
  index: number
  stint: Stint
  errors: StrategyViolation[]
  canRemove: boolean
  onCompoundChange: (index: number, compound: string) => void
  onLapsChange: (index: number, laps: number) => void
  onRemove: (index: number) => void
}

function parseLaps(raw: string): number {
  if (raw === '') return 0
  const laps = Number(raw)
  return Number.isFinite(laps) ? laps : 0
}

export function StintRow({
  index,
  stint,
  errors,
  canRemove,
  onCompoundChange,
  onLapsChange,
  onRemove,
}: StintRowProps) {
  const { t } = useTranslation()
  const errorId = useId()
  const number = index + 1
  const lapsInvalid = errors.some((error) => error.field === `stints[${index}].laps`)
  const compoundInvalid = errors.some((error) => error.field === `stints[${index}].compound`)

  return (
    <li
      className={cn(
        'grid gap-2 rounded-sm border bg-surface-2 p-3',
        errors.length > 0 ? 'border-danger' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-16 font-display text-[15px] font-bold uppercase tracking-[0.5px]">
          {t('strategy.stints.stint', { number })}
        </span>
        {isTyreCompound(stint.compound) && <CompoundBadge compound={stint.compound} />}
        <select
          aria-label={t('strategy.stints.compound', { number })}
          aria-invalid={compoundInvalid || undefined}
          aria-describedby={compoundInvalid ? errorId : undefined}
          value={stint.compound}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onCompoundChange(index, event.target.value)
          }
          className={cn(CONTROL, 'min-w-36 flex-1 min-[720px]:flex-none')}
        >
          {!isTyreCompound(stint.compound) && (
            <option value={stint.compound}>{stint.compound}</option>
          )}
          {TYRE_COMPOUNDS.map((compound: TyreCompound) => (
            <option key={compound} value={compound}>
              {t(`compounds.${compound}`)}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="0"
          aria-label={t('strategy.stints.laps', { number })}
          aria-invalid={lapsInvalid || undefined}
          aria-describedby={lapsInvalid ? errorId : undefined}
          value={Number.isFinite(stint.laps) && stint.laps !== 0 ? stint.laps : ''}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onLapsChange(index, parseLaps(event.target.value))
          }
          className={cn(CONTROL, 'w-24 font-mono tabular-nums')}
        />
        <button
          type="button"
          disabled={!canRemove}
          aria-label={t('strategy.stints.remove', { number })}
          onClick={() => onRemove(index)}
          className="ml-auto grid size-11 cursor-pointer place-items-center rounded-sm text-ink-muted hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent [&_svg]:size-[18px]"
        >
          <CloseIcon />
        </button>
      </div>
      {errors.length > 0 && (
        <ul id={errorId} className="m-0 grid list-none gap-1 p-0">
          {errors.map((error, position) => (
            <li
              key={`${error.code}-${position}`}
              className="flex items-start gap-2 text-label text-danger"
            >
              <ErrorIcon className="mt-0.5 size-4 flex-none" />
              <span>{translateViolation(t, error)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
