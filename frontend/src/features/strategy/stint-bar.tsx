import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LapAxis } from '@/features/races/lap-axis'
import { WeatherBand } from '@/features/races/weather-band'
import type { Stint, Tyre, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { compoundNameKey, isTyreCompound } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import { AlertIcon } from '@/shared/ui/icons'
import { lapAtPointer, stintEnds } from './pit-lap'

const COMPOUND_BG: Record<TyreCompound, string> = {
  SOFT: 'bg-tyre-soft',
  MEDIUM: 'bg-tyre-medium',
  HARD: 'bg-tyre-hard',
  INTERMEDIATE: 'bg-tyre-inter',
  WET: 'bg-tyre-wet',
}

const TINY_SHARE = 0.09
const NARROW_GAP_SHARE = 0.12
const BAR_HEIGHT = 64
const PIN_TOP = 30
const WEATHER_HEIGHT = 36

interface StintBarProps {
  stints: Stint[]
  raceLaps: number
  forecast: WeatherSegment[]
  tyres: Tyre[]
  errorStints: ReadonlySet<number>
  warningStints: ReadonlySet<number>
  onMovePit: (index: number, lap: number) => void
}

function lapsOf(stint: Stint): number {
  return Number.isFinite(stint.laps) && stint.laps > 0 ? stint.laps : 0
}

const SEGMENT =
  'relative flex min-w-0 flex-col justify-center overflow-hidden px-2 py-1 text-on-tyre min-[721px]:px-3 min-[721px]:py-2 ' +
  'not-first:pl-[calc(var(--space-3)+3px)] not-first:shadow-[inset_3px_0_0_var(--bg)]'

export function StintBar({
  stints,
  raceLaps,
  forecast,
  tyres,
  errorStints,
  warningStints,
  onMovePit,
}: StintBarProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')
  const barRef = useRef<HTMLDivElement>(null)
  const stopDrag = useRef<(() => void) | null>(null)
  const ends = stintEnds(stints)
  const sum = ends.at(-1) ?? 0
  const span = Math.max(sum, raceLaps)
  const showWeather = sum <= raceLaps
  const missing = raceLaps - sum
  const barTop = PIN_TOP + (showWeather ? WEATHER_HEIGHT : 0)
  const pinLine = barTop - 22 + BAR_HEIGHT

  useEffect(() => () => stopDrag.current?.(), [])

  function startDrag(index: number, event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.currentTarget.focus()
    stopDrag.current?.()
    const move = (moveEvent: globalThis.PointerEvent) => {
      const rect = barRef.current?.getBoundingClientRect()
      if (rect === undefined) return
      onMovePit(index, lapAtPointer(moveEvent.clientX, rect.left, rect.width, span))
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      stopDrag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    stopDrag.current = end
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (delta === 0) return
    event.preventDefault()
    onMovePit(index, (ends[index] ?? 0) + delta)
  }

  return (
    <div>
      <div style={{ '--pl': `${pinLine}px` } as React.CSSProperties} className="relative pt-[30px]">
        {stints.slice(0, -1).map((_, index) => (
          <div
            key={`pin-${index}`}
            style={{ left: `${((ends[index] ?? 0) / span) * 100}%` }}
            className={cn(
              'absolute top-1 z-[2] -translate-x-1/2 whitespace-nowrap rounded-sm border border-line-strong bg-surface-2 px-1',
              'font-mono text-[11px] font-bold text-ink',
              'after:absolute after:left-1/2 after:top-full after:h-[var(--pl)] after:w-px after:bg-ink after:opacity-90 after:content-[""]',
            )}
          >
            {`${lap}${ends[index]}`}
          </div>
        ))}
        {showWeather && <WeatherBand forecast={forecast} tyres={tyres} />}
        <div
          ref={barRef}
          role="list"
          aria-label={t('strategy.bar.label')}
          className="relative flex h-16 bg-bg"
        >
          {stints.map((stint, index) => {
            const laps = lapsOf(stint)
            const known = isTyreCompound(stint.compound)
            const name = known ? t(compoundNameKey(stint.compound as TyreCompound)) : '—'
            const from = (ends[index] ?? 0) - laps + 1
            const to = ends[index] ?? 0
            const label = t('strategy.bar.stint', { number: index + 1, compound: name, from, to })
            const tiny = laps / span < TINY_SHARE
            return (
              <div
                key={index}
                role="listitem"
                aria-label={label}
                title={label}
                data-invalid={errorStints.has(index) ? 'true' : undefined}
                data-warning={warningStints.has(index) ? 'true' : undefined}
                style={{ flex: `${laps} 1 0` }}
                className={cn(
                  SEGMENT,
                  known ? COMPOUND_BG[stint.compound as TyreCompound] : 'bg-surface-3',
                  errorStints.has(index) && 'outline-2 outline-offset-2 outline-danger',
                  warningStints.has(index) &&
                    'after:absolute after:right-1.5 after:top-1.5 after:size-2.5 after:bg-warning after:content-[""] after:[clip-path:polygon(50%_0,100%_100%,0_100%)]',
                )}
              >
                <div className="flex items-center gap-2 whitespace-nowrap font-display text-base font-extrabold uppercase leading-[22px] tracking-[0.5px]">
                  {known && (
                    <CompoundBadge
                      compound={stint.compound as TyreCompound}
                      size="sm"
                      decorative
                      className="bg-on-tyre"
                    />
                  )}
                  {!tiny && <span className="max-[720px]:hidden">{name}</span>}
                </div>
                {!tiny && (
                  <div className="whitespace-nowrap font-mono text-xs font-semibold leading-[22px] opacity-85 max-[720px]:hidden">
                    {t('strategy.bar.sub', {
                      from: `${lap}${from}`,
                      to: `${lap}${to}`,
                      laps,
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {missing > 0 && (
            <div
              role="listitem"
              aria-label={t('strategy.bar.gap', { count: missing })}
              style={{ flex: `${missing} 1 0` }}
              className={cn(
                SEGMENT,
                'border border-dashed border-danger text-danger',
                'bg-[repeating-linear-gradient(135deg,var(--danger-surface)_0_8px,var(--bg)_8px_16px)]',
              )}
            >
              <div className="flex items-center gap-2 whitespace-nowrap font-display text-base font-extrabold uppercase leading-[22px] tracking-[0.5px] [&_svg]:size-4">
                <AlertIcon />
                <span className="max-[720px]:hidden">
                  {missing / span < NARROW_GAP_SHARE
                    ? t('strategy.bar.gapShort', { count: missing })
                    : t('strategy.bar.gapTitle', { count: missing })}
                </span>
              </div>
              <div className="whitespace-nowrap font-mono text-xs font-semibold leading-[22px] opacity-85 max-[720px]:hidden">
                {`${lap}${sum + 1}–${lap}${raceLaps}`}
              </div>
            </div>
          )}
        </div>
        {stints.slice(0, -1).map((_, index) => (
          <button
            key={`handle-${index}`}
            type="button"
            aria-label={t('strategy.bar.handle', { number: index + 1, lap: ends[index] })}
            onPointerDown={(event) => startDrag(index, event)}
            onKeyDown={(event) => onKeyDown(index, event)}
            style={{ left: `${((ends[index] ?? 0) / span) * 100}%`, top: barTop }}
            className={cn(
              'group absolute bottom-0 z-[3] w-5 -translate-x-1/2 cursor-ew-resize touch-none border-0 bg-transparent p-0',
              'before:absolute before:inset-y-3.5 before:left-[7px] before:w-1.5 before:rounded-[3px] before:border before:border-ink before:bg-bg before:content-[""]',
              'hover:before:bg-ink',
            )}
          />
        ))}
      </div>
      <LapAxis total={span} />
    </div>
  )
}
