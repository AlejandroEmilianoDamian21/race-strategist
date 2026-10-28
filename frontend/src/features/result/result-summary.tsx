import { useTranslation } from 'react-i18next'
import { formatLapTime } from '@/features/races/format'
import { teamColor } from '@/features/races/team-colors'
import { Fact } from '@/features/strategy/strategy-facts'
import type { RaceOverview, SimulationResult } from '@/shared/api/types'
import { compoundNameKey } from '@/shared/domain/compounds'
import { cn } from '@/shared/lib/cn'
import { Card } from '@/shared/ui/card'
import { TyreChip } from '@/shared/ui/compound-badge'
import { DownIcon, UpIcon } from '@/shared/ui/icons'
import { Assumptions } from './assumptions'
import { driverInfo } from './driver-info'
import { formatDelta, formatTotalTime } from './format'
import { summarize } from './summary'

interface ResultSummaryProps {
  result: SimulationResult
  previous: SimulationResult | null
  overview: RaceOverview
}

const EYEBROW = 'eyebrow text-ink-muted'

export function ResultSummary({ result, previous, overview }: ResultSummaryProps) {
  const { t } = useTranslation()
  const lap = t('raceInfo.drivers.lapShort')
  const summary = summarize(result, previous)
  const driver = driverInfo(overview, result.driverId)
  const longestName = t(compoundNameKey(summary.longest.compound))
  const stopsLabel =
    summary.stops === 0
      ? t('strategy.issues.noStops')
      : t('strategy.issues.stops', { count: summary.stops })
  const sentence =
    (summary.stops > 0
      ? t('result.summary.sentence.pits', {
          laps: summary.pitLaps
            .map((pitLap) => t('result.summary.sentence.pitLap', { lap: `${lap}${pitLap}` }))
            .join(t('result.summary.sentence.pitJoiner')),
        })
      : t('result.summary.sentence.noPits')) +
    t('result.summary.sentence.longest', {
      compound: longestName,
      count: summary.longest.laps,
    }) +
    (summary.hasWetLoss
      ? t('result.summary.sentence.wet', { loss: formatDelta(summary.wetLoss).replace('+', '') })
      : t('result.summary.sentence.dry'))
  const better = summary.delta !== null && summary.delta <= 0

  return (
    <Card cut>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={EYEBROW}>{t('result.summary.eyebrow')}</p>
        {driver !== null && (
          <Fact>
            <i
              aria-hidden="true"
              style={{ background: teamColor(driver.teamName) }}
              className="inline-block h-3.5 w-1"
            />
            {t('result.summary.chip', {
              number: driver.number,
              driver: driver.name,
              race: overview.race.name,
            })}
          </Fact>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-display text-[26px] font-extrabold uppercase leading-[30px] tracking-[0.5px] max-[720px]:text-[21px] max-[720px]:leading-[26px]">
        <span>{stopsLabel}</span>
        <span className="text-accent">/</span>
        {summary.compounds.map((compound, index) => (
          <span key={index} className="contents">
            {index > 0 && <span className="font-semibold text-ink-faint">→</span>}
            <TyreChip compound={compound} />
          </span>
        ))}
      </div>
      <p className="mt-2 text-[17px] leading-6 text-ink-muted">{sentence}</p>
      <p className={`${EYEBROW} mt-6`}>{t('result.summary.total')}</p>
      <div className="flex flex-wrap items-baseline gap-4">
        <div className="mt-2 time-hero max-[720px]:text-[44px] max-[720px]:leading-12">
          {formatTotalTime(result.totalTime)}
        </div>
        {summary.delta !== null && (
          <span
            data-trend={better ? 'better' : 'worse'}
            className={cn(
              'inline-flex items-center gap-1 rounded-sm bg-surface-2 px-2 py-0.5 font-mono text-[15px] font-semibold [&_svg]:size-3.5',
              better ? 'text-success' : 'text-danger',
            )}
          >
            {better ? <DownIcon /> : <UpIcon />}
            {t('result.summary.vsPrevious', { delta: formatDelta(summary.delta) })}
          </span>
        )}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Kpi
          label={t('result.summary.kpi.fastest')}
          value={formatLapTime(summary.bestLap.time)}
          note={t('result.summary.kpi.fastestNote', {
            lap: `${lap}${summary.bestLap.lap}`,
            compound: t(compoundNameKey(summary.bestLap.compound)),
          })}
        />
        <Kpi
          label={t('result.summary.kpi.pit')}
          value={formatDelta(summary.pitLossTotal)}
          note={stopsLabel}
        />
        <Kpi
          label={t('result.summary.kpi.average')}
          value={formatLapTime(summary.averageLap)}
          note={t('result.summary.kpi.averageNote', { count: summary.totalLaps })}
        />
      </div>
      <Assumptions result={result} overview={overview} />
    </Card>
  )
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-l border-line-strong pl-3">
      <small className="text-[12px] font-semibold uppercase tracking-[1px] text-ink-muted">
        {label}
      </small>
      <b className="block font-mono text-[20px] font-semibold leading-[26px] max-[720px]:text-base">
        {value}
      </b>
      <span className="text-caption text-ink-faint">{note}</span>
    </div>
  )
}
