import { useId, useState, type ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { Stint } from '@/shared/api/types'
import { COMPOUNDS, compoundNameKey, isTyreCompound } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import { FlagEndIcon, TrashIcon } from '@/shared/ui/icons'
import { INPUT_CLASS } from './controls'

interface StintRowProps {
  index: number
  stint: Stint
  end: number
  raceLaps: number
  isLast: boolean
  invalid: boolean
  canRemove: boolean
  onCompoundChange: (index: number, compound: string) => void
  onLapsChange: (index: number, laps: number) => void
  onPitChange: (index: number, lap: number) => void
  onRemove: (index: number) => void
}

const FIELD = 'grid min-w-0 gap-0.5'
const FIELD_LABEL = 'text-caption leading-[22px]'
const MUTED_LABEL = 'text-caption font-semibold leading-[18px] text-ink-muted'
const BOLD = { b: <b className="font-bold text-ink" /> }
const PIT_BOLD = { b: <b className="num font-bold text-ink" /> }

function parseLaps(raw: string): number {
  if (raw === '') return 0
  const laps = Number(raw)
  return Number.isFinite(laps) ? laps : 0
}

function stripLeadingZeros(raw: string): string {
  return raw.replace(/^(-?)0+(?=\d)/, '$1')
}

export function StintRow({
  index,
  stint,
  end,
  raceLaps,
  isLast,
  invalid,
  canRemove,
  onCompoundChange,
  onLapsChange,
  onPitChange,
  onRemove,
}: StintRowProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')
  const lapsId = useId()
  const pitId = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const number = index + 1
  const lapsValue =
    draft !== null && parseLaps(draft) === stint.laps
      ? draft
      : Number.isFinite(stint.laps)
        ? String(stint.laps)
        : ''
  const name = isTyreCompound(stint.compound) ? t(compoundNameKey(stint.compound)) : '—'

  function onLapsInput(event: ChangeEvent<HTMLInputElement>) {
    const raw = stripLeadingZeros(event.target.value)
    setDraft(raw)
    onLapsChange(index, parseLaps(raw))
  }

  function onPitInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.value === '') return
    onPitChange(index, Number(event.target.value))
  }

  return (
    <li
      data-stint={index}
      data-invalid={invalid ? 'true' : undefined}
      className={cn(
        'grid items-center gap-4 rounded-sm border bg-surface-2 px-4 py-3',
        'grid-cols-[72px_auto_88px_minmax(160px,1fr)_40px]',
        'max-[860px]:gap-3 max-[860px]:grid-cols-[minmax(0,1fr)_80px_40px]',
        'max-[860px]:[grid-template-areas:"n_n_del""pick_pick_pick""pit_laps_laps"]',
        '[&>*]:min-w-0',
        invalid ? 'border-danger bg-danger-surface' : 'border-transparent',
      )}
    >
      <div className="font-display text-[17px] font-extrabold uppercase max-[860px]:[grid-area:n]">
        {t('strategy.rows.stint', { number })}
      </div>
      <div className={cn(FIELD, 'max-[860px]:[grid-area:pick]')}>
        <span className={MUTED_LABEL}>
          <Trans i18nKey="strategy.rows.compound" values={{ name }} components={BOLD} />
        </span>
        <div
          role="radiogroup"
          data-field="compound"
          aria-label={t('strategy.rows.group', { number })}
          className="flex gap-1"
        >
          {COMPOUNDS.map((compound) => {
            const checked = stint.compound === compound.api
            const label = t(compound.nameKey)
            return (
              <button
                key={compound.api}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={label}
                title={label}
                onClick={() => onCompoundChange(index, compound.api)}
                className={cn(
                  'inline-grid h-[38px] w-10 cursor-pointer place-items-center rounded-sm border p-0 hover:opacity-100',
                  'max-[720px]:w-auto max-[720px]:flex-1',
                  checked
                    ? 'border-ink bg-bg text-ink opacity-100'
                    : 'border-line bg-surface-1 opacity-55',
                )}
              >
                <CompoundBadge compound={compound.api} decorative />
              </button>
            )
          })}
        </div>
      </div>
      <div className={cn(FIELD, 'max-[860px]:[grid-area:laps]')}>
        <label htmlFor={lapsId} className={FIELD_LABEL}>
          {t('strategy.rows.laps')}
        </label>
        <input
          id={lapsId}
          type="number"
          data-field="laps"
          min={1}
          max={raceLaps}
          aria-label={t('strategy.rows.lapsOf', { number })}
          aria-invalid={invalid || undefined}
          value={lapsValue}
          onChange={onLapsInput}
          onBlur={() => setDraft(null)}
          className={INPUT_CLASS}
        />
      </div>
      {isLast ? (
        <div className={cn(FIELD, 'max-[860px]:[grid-area:pit]')}>
          <span className={MUTED_LABEL}>{t('strategy.rows.end')}</span>
          <div className="flex h-9 items-center gap-2 font-mono text-[13px] text-ink-muted [&_svg]:size-4">
            <FlagEndIcon />
            {t('strategy.rows.flag', { lap: `${lap}${raceLaps}` })}
          </div>
        </div>
      ) : (
        <div className={cn(FIELD, 'max-[860px]:[grid-area:pit]')}>
          <label htmlFor={pitId} className={FIELD_LABEL}>
            <Trans i18nKey="strategy.rows.pit" values={{ lap: end }} components={PIT_BOLD} />
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 max-[720px]:grid-cols-[minmax(0,1fr)]">
            <input
              type="range"
              className="pit-range"
              min={1}
              max={raceLaps - 1}
              value={end}
              aria-label={t('strategy.rows.pitSlider', { number })}
              onChange={onPitInput}
            />
            <input
              id={pitId}
              type="number"
              min={1}
              max={raceLaps - 1}
              value={end}
              onChange={onPitInput}
              className={cn(INPUT_CLASS, 'max-[720px]:hidden')}
            />
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={!canRemove}
        aria-label={t('strategy.rows.remove', { number })}
        onClick={() => onRemove(index)}
        className="grid size-9 cursor-pointer place-items-center rounded-sm border border-transparent bg-transparent text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-transparent max-[860px]:[grid-area:del] [&_svg]:size-[18px]"
      >
        <TrashIcon />
      </button>
    </li>
  )
}
