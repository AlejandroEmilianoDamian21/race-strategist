import { useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formatLapTime, formatSignedSeconds } from '@/features/races/format'
import type { SimulationResult, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { CompoundBadge } from '@/shared/ui/compound-badge'
import {
  CHART,
  chartScale,
  lapAtX,
  lapXTicks,
  linePath,
  plotX,
  plotY,
  rainBands,
  stintBands,
  yTicks,
} from './lap-chart'

interface LapTimeChartProps {
  result: SimulationResult
  previous: SimulationResult | null
  forecast: WeatherSegment[]
}

const BAND_FILL: Record<TyreCompound, string> = {
  SOFT: 'fill-tyre-soft',
  MEDIUM: 'fill-tyre-medium',
  HARD: 'fill-tyre-hard',
  INTERMEDIATE: 'fill-tyre-inter',
  WET: 'fill-tyre-wet',
}

const RAIN_STRIP_HEIGHT = 5
const WET_LOSS_FLOOR = 0.05

interface Hover {
  lap: number
  left: number
  top: number
}

export function LapTimeChart({ result, previous, forecast }: LapTimeChartProps) {
  const { t } = useTranslation()
  const lapPrefix = t('raceInfo.drivers.lapShort')
  const [hover, setHover] = useState<Hover | null>(null)
  const total = result.laps.length
  const scale = chartScale(result, previous)
  const plotBottom = CHART.H - CHART.mb
  const plotRight = CHART.W - CHART.mr

  function onMove(event: PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement
    if (svg === null) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return
    const lap = lapAtX(((event.clientX - rect.left) / rect.width) * CHART.W, total)
    const point = result.laps[lap - 1]
    if (point === undefined) return
    setHover({
      lap,
      left: (plotX(lap, total) / CHART.W) * rect.width,
      top: (plotY(point.time, scale) / CHART.H) * rect.height,
    })
  }

  const point = hover === null ? undefined : result.laps[hover.lap - 1]
  const before = hover === null || previous === null ? undefined : previous.laps[hover.lap - 1]

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('result.chart.title')}</CardTitle>
        <div className="flex flex-wrap gap-4 text-[13px] text-ink-muted [&_i]:mr-1 [&_i]:inline-block [&_i]:h-0 [&_i]:w-[18px] [&_i]:align-middle">
          <span>
            <i className="border-t-2 border-series-current" />
            {t('result.chart.current')}
          </span>
          {previous !== null && (
            <span>
              <i className="border-t-2 border-dashed border-series-previous" />
              {t('result.chart.previous')}
            </span>
          )}
          <span>
            <i className="border-t border-dashed border-warning" />
            {t('result.chart.pit')}
          </span>
          <span>
            <i className="border-t-[5px] border-rain opacity-80" />
            {t('result.chart.rain')}
          </span>
        </div>
      </CardHead>
      <div className="relative max-[720px]:overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART.W} ${CHART.H}`}
          role="img"
          aria-label={t('result.chart.label')}
          className="block h-auto w-full overflow-visible max-[720px]:min-w-[640px]"
        >
          {stintBands(result.stints, total).map((band, index) => (
            <rect
              key={`band-${index}`}
              data-band
              x={band.x0}
              y={CHART.mt}
              width={band.x1 - band.x0}
              height={plotBottom - CHART.mt}
              className={`${BAND_FILL[band.compound]} opacity-[.09]`}
            />
          ))}
          {stintBands(result.stints, total).map((band, index) => (
            <text
              key={`label-${index}`}
              x={band.x0 + 8}
              y={CHART.mt + 16}
              className={`${BAND_FILL[band.compound]} font-display text-[13px] font-extrabold uppercase tracking-[1px]`}
            >
              {t(compoundNameKey(band.compound))}
            </text>
          ))}
          <g className="stroke-line stroke-1">
            {yTicks(scale).map((tick) => (
              <line
                key={tick}
                x1={CHART.ml}
                x2={plotRight}
                y1={plotY(tick, scale)}
                y2={plotY(tick, scale)}
              />
            ))}
          </g>
          <g className="fill-ink-faint font-mono text-[11px]">
            {yTicks(scale).map((tick) => (
              <text key={tick} x={CHART.ml - 8} y={plotY(tick, scale) + 4} textAnchor="end">
                {formatLapTime(tick).replace('.000', '')}
              </text>
            ))}
            {lapXTicks(total).map((lap) => (
              <text key={lap} x={plotX(lap, total)} y={CHART.H - 8} textAnchor="middle">
                {`${lapPrefix}${lap}`}
              </text>
            ))}
          </g>
          {rainBands(forecast, total).map((band, index) => (
            <rect
              key={`rain-${index}`}
              data-rain
              x={band.x0}
              y={plotBottom - RAIN_STRIP_HEIGHT}
              width={band.x1 - band.x0}
              height={RAIN_STRIP_HEIGHT}
              className="fill-rain"
              style={{ opacity: 0.3 + band.intensity * 0.7 }}
            >
              <title>{t('result.chart.rainTitle', { value: band.intensity })}</title>
            </rect>
          ))}
          {result.pitStops.map((stop) => (
            <g key={stop.lap}>
              <line
                x1={plotX(stop.lap, total)}
                x2={plotX(stop.lap, total)}
                y1={CHART.mt - 6}
                y2={plotBottom}
                className="stroke-warning stroke-1 [stroke-dasharray:2_3]"
              />
              <text
                x={plotX(stop.lap, total)}
                y={CHART.mt - 12}
                textAnchor="middle"
                className="fill-warning font-mono text-[11px] font-bold"
              >
                {t('result.chart.box', {
                  lap: `${lapPrefix}${stop.lap}`,
                  loss: formatSignedSeconds(stop.totalLoss),
                })}
              </text>
            </g>
          ))}
          {previous !== null && (
            <path
              data-series="previous"
              d={linePath(previous.laps, total, scale)}
              className="fill-none stroke-series-previous stroke-2 [stroke-dasharray:5_4] [stroke-linejoin:round]"
            />
          )}
          <path
            data-series="current"
            d={linePath(result.laps, total, scale)}
            className="fill-none stroke-series-current stroke-2 [stroke-linejoin:round]"
          />
          {hover !== null && point !== undefined && (
            <>
              <line
                x1={plotX(hover.lap, total)}
                x2={plotX(hover.lap, total)}
                y1={CHART.mt}
                y2={plotBottom}
                className="stroke-ink-faint stroke-1"
              />
              <circle
                cx={plotX(hover.lap, total)}
                cy={plotY(point.time, scale)}
                r={4}
                className="fill-series-current"
              />
            </>
          )}
          <rect
            data-hit
            x={CHART.ml}
            y={CHART.mt}
            width={plotRight - CHART.ml}
            height={plotBottom - CHART.mt}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && point !== undefined && (
          <div
            role="tooltip"
            style={{ left: hover.left, top: hover.top }}
            className="pointer-events-none absolute -mt-2.5 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-line-strong bg-surface-2 px-3 py-2 text-xs leading-[18px] shadow-pop"
          >
            <div className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
              {t('result.chart.tip.lap', { lap: hover.lap })}
            </div>
            <b className="font-mono text-[14px]">{formatLapTime(point.time)}</b>{' '}
            <CompoundBadge compound={point.compound} size="sm" decorative />{' '}
            <span className="text-ink-muted">
              {t('result.chart.tip.age', {
                age: point.tyreAge,
                compound: t(compoundNameKey(point.compound)).toLowerCase(),
              })}
            </span>
            {point.rainIntensity > 0 && (
              <div className="text-rain">
                {point.rainPenalty > WET_LOSS_FLOOR
                  ? t('result.chart.tip.rainWrong', {
                      value: point.rainIntensity,
                      loss: formatSignedSeconds(point.rainPenalty),
                    })
                  : t('result.chart.tip.rainRight', { value: point.rainIntensity })}
              </div>
            )}
            {point.pitLoss > 0 && <div className="text-warning">{t('result.chart.tip.pit')}</div>}
            {before !== undefined && (
              <div className="text-series-previous">
                {t('result.chart.tip.previous', { time: formatLapTime(before.time) })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
