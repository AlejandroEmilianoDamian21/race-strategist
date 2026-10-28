import { useTranslation } from 'react-i18next'
import { formatLapTime, formatSignedSeconds } from '@/features/races/format'
import type { PitStop, SimulationResult, StintResult } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { Card, CardHead, CardTitle } from '@/shared/ui/card'
import { CompoundBadge, TyreChip } from '@/shared/ui/compound-badge'
import { WrenchIcon } from '@/shared/ui/icons'
import { breakdownRows, breakdownTotals, hasRainLoss } from './breakdown'
import { formatStintTime, formatTotalTime } from './format'

interface BreakdownTableProps {
  result: SimulationResult
}

const TH =
  'whitespace-nowrap border-b border-line-strong px-3 pb-2 text-left font-display text-[12px] font-bold uppercase tracking-[1.2px] text-ink-muted'
const TD = 'border-b border-line p-3 font-mono tabular-nums whitespace-nowrap'
const TD_TEXT = 'border-b border-line p-3 font-sans font-semibold tabular-nums whitespace-nowrap'
const RIGHT = 'text-right'

export function BreakdownTable({ result }: BreakdownTableProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')
  const rows = breakdownRows(result)
  const totals = breakdownTotals(result)

  return (
    <Card>
      <CardHead>
        <CardTitle>{t('result.table.title')}</CardTitle>
      </CardHead>
      <div className="overflow-x-auto max-[720px]:hidden">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              <th className={TH}>{t('result.table.stint')}</th>
              <th className={TH}>{t('result.table.compound')}</th>
              <th className={TH}>{t('result.table.from')}</th>
              <th className={TH}>{t('result.table.to')}</th>
              <th className={cn(TH, RIGHT)}>{t('result.table.laps')}</th>
              <th className={cn(TH, RIGHT)}>{t('result.table.average')}</th>
              <th className={cn(TH, RIGHT)}>{t('result.table.rain')}</th>
              <th className={cn(TH, RIGHT)}>{t('result.table.time')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === 'stint' ? (
                <StintRow key={`s${row.stint.index}`} stint={row.stint} lap={lap} />
              ) : (
                <PitRow key={`p${row.stop.lap}`} stop={row.stop} lap={lap} />
              ),
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className={cn(TD_TEXT, 'border-b-0 pt-4 text-ink')}>
                {t('result.table.total')}
              </td>
              <td className={cn(TD, RIGHT, 'border-b-0 pt-4 font-bold text-ink')}>{totals.laps}</td>
              <td className="border-b-0 p-3 pt-4" />
              <td className="border-b-0 p-3 pt-4" />
              <td className={cn(TD, RIGHT, 'border-b-0 pt-4 font-bold text-ink')}>
                {formatTotalTime(totals.time)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="hidden gap-2 max-[720px]:grid">
        {rows.map((row) =>
          row.kind === 'stint' ? (
            <StintCard key={`s${row.stint.index}`} stint={row.stint} lap={lap} />
          ) : (
            <PitCard key={`p${row.stop.lap}`} stop={row.stop} lap={lap} />
          ),
        )}
      </div>
    </Card>
  )
}

function StintRow({ stint, lap }: { stint: StintResult; lap: string }) {
  const rain = hasRainLoss(stint.rainLoss)

  return (
    <tr>
      <td className={TD_TEXT}>{stint.index + 1}</td>
      <td className={TD_TEXT}>
        <TyreChip compound={stint.compound} size="sm" />
      </td>
      <td className={TD}>{`${lap}${stint.startLap}`}</td>
      <td className={TD}>{`${lap}${stint.endLap}`}</td>
      <td className={cn(TD, RIGHT)}>{stint.laps}</td>
      <td className={cn(TD, RIGHT)}>{formatLapTime(stint.averageLapTime)}</td>
      <td className={cn(TD, RIGHT, rain && 'text-warning')}>
        {rain ? formatSignedSeconds(stint.rainLoss) : '—'}
      </td>
      <td className={cn(TD, RIGHT)}>
        <b>{formatStintTime(stint.time)}</b>
      </td>
    </tr>
  )
}

function PitRow({ stop, lap }: { stop: PitStop; lap: string }) {
  const { t } = useTranslation()
  const cell =
    'border-b border-line bg-surface-2 px-3 py-2 font-mono text-[13px] tabular-nums whitespace-nowrap text-ink-muted'

  return (
    <tr>
      <td className={cell} />
      <td className={cn(cell, 'font-sans font-semibold')}>
        <WrenchIcon width={14} height={14} className="mr-1.5 inline align-[-2px]" />
        {t('result.table.pit')}
      </td>
      <td colSpan={2} className={cell}>
        {`${lap}${stop.lap}`}
      </td>
      <td className={cell} />
      <td colSpan={2} className={cn(cell, RIGHT)}>
        {`${stop.pitLaneLoss} + ${stop.tyreChangeTime}`}
      </td>
      <td className={cn(cell, RIGHT, 'text-warning')}>{formatSignedSeconds(stop.totalLoss)}</td>
    </tr>
  )
}

function StintCard({ stint, lap }: { stint: StintResult; lap: string }) {
  const { t } = useTranslation()
  const rain = hasRainLoss(stint.rainLoss)

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-sm bg-surface-2 p-3">
      <CompoundBadge compound={stint.compound} decorative />
      <div>
        <b>
          {t('result.table.cardTitle', {
            number: stint.index + 1,
            compound: t(compoundNameKey(stint.compound)),
          })}
        </b>
        <div className="text-caption text-ink-faint font-mono tabular-nums">
          {t('result.table.cardDetail', {
            from: `${lap}${stint.startLap}`,
            to: `${lap}${stint.endLap}`,
            count: stint.laps,
            average: formatLapTime(stint.averageLapTime),
          })}
          {rain && t('result.table.cardRain', { loss: formatSignedSeconds(stint.rainLoss) })}
        </div>
      </div>
      <b className="font-mono text-[13px] tabular-nums">{formatStintTime(stint.time)}</b>
    </div>
  )
}

function PitCard({ stop, lap }: { stop: PitStop; lap: string }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-sm border border-dashed border-line-strong bg-transparent p-3">
      <span className="text-warning [&_svg]:size-[18px]">
        <WrenchIcon />
      </span>
      <span className="text-caption text-ink-faint">
        {t('result.table.cardPit', { lap: `${lap}${stop.lap}` })}
      </span>
      <b className="font-mono text-[13px] tabular-nums text-warning">
        {formatSignedSeconds(stop.totalLoss)}
      </b>
    </div>
  )
}
