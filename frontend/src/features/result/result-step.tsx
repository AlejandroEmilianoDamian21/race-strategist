import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GhostBar } from '@/features/strategy/ghost-bar'
import { StintBar } from '@/features/strategy/stint-bar'
import type { RaceOverview, Stint } from '@/shared/api/types'
import { SectionHead } from '@/shared/ui/section-head'
import { StatusPanel } from '@/shared/ui/status-panel/status-panel'
import { technicalLine } from '@/shared/api/technical-line'
import { Toggle } from '@/shared/ui/toggle'
import { BreakdownTable } from './breakdown-table'
import { LapTimeChart } from './lap-time-chart'
import { PitStops } from './pit-stops'
import { ResultSummary } from './result-summary'
import { StintTimeline } from './stint-timeline'
import type { SimulationView } from './use-simulation'

interface ResultStepProps {
  view: SimulationView
  overview: RaceOverview | undefined
  builderStints: Stint[] | null
  lap: number | null
  onRetry: () => void
  onBackToStrategy: (field?: string) => void
  onBackToCalendar: () => void
}

export function ResultStep({
  view,
  overview,
  builderStints,
  lap,
  onRetry,
  onBackToStrategy,
  onBackToCalendar,
}: ResultStepProps) {
  const { t } = useTranslation()
  const [compare, setCompare] = useState(true)
  const hasPrevious = view.kind === 'success' && view.previous !== null

  return (
    <section id="step-result" aria-labelledby="step-result-title" className="scroll-mt-24">
      <SectionHead
        step={5}
        title={t('result.title')}
        titleId="step-result-title"
        right={
          hasPrevious ? (
            <Toggle checked={compare} onChange={setCompare}>
              {t('result.compare')}
            </Toggle>
          ) : undefined
        }
      />
      {view.kind === 'idle' && (
        <StatusPanel
          variant="empty-result"
          bar={
            overview !== undefined && builderStints !== null ? (
              <GhostBar
                stints={builderStints}
                label={t('strategy.bar.label')}
                className="mt-2 h-6"
              />
            ) : undefined
          }
        />
      )}
      {view.kind === 'loading' && (
        <StatusPanel
          variant="sim-loading"
          lap={lap === null ? 1 : Math.max(1, lap)}
          totalLaps={overview?.race.laps ?? 0}
          bar={
            overview === undefined ? undefined : (
              <StintBar
                stints={view.request.stints}
                raceLaps={overview.race.laps}
                forecast={overview.weather.forecast}
                tyres={overview.tyres}
                weather={false}
                showScale={false}
              />
            )
          }
        />
      )}
      {view.kind === 'error' &&
        (view.error.kind === 'invalid-strategy' && view.error.violations !== undefined ? (
          <StatusPanel
            variant="invalid"
            violations={view.error.violations}
            technical={technicalLine(view.error)}
            onBack={() => onBackToStrategy(view.error.violations?.[0]?.field)}
          />
        ) : (
          <StatusPanel
            variant="api-error"
            error={view.error}
            onRetry={onRetry}
            onBack={onBackToCalendar}
          />
        ))}
      {view.kind === 'success' && overview !== undefined && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 max-[860px]:grid-cols-[minmax(0,1fr)]">
            <ResultSummary
              result={view.current}
              previous={compare ? view.previous : null}
              overview={overview}
            />
            <PitStops result={view.current} />
          </div>
          <StintTimeline
            result={view.current}
            previous={compare ? view.previous : null}
            overview={overview}
          />
          <BreakdownTable result={view.current} />
          <LapTimeChart
            result={view.current}
            previous={compare ? view.previous : null}
            forecast={overview.weather.forecast}
          />
        </div>
      )}
    </section>
  )
}
