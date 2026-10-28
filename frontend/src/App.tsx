import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RaceInfoStep } from '@/features/races/race-info-step'
import { RacesStep } from '@/features/races/races-step'
import { useRaceOverview } from '@/features/races/use-race-overview'
import { useRaceSelection } from '@/features/races/use-race-selection'
import { ResultStep } from '@/features/result/result-step'
import { useSimulation } from '@/features/result/use-simulation'
import { useSimulationProgress } from '@/features/result/use-simulation-progress'
import { focusStint } from '@/features/strategy/focus-stint'
import { StrategyStep } from '@/features/strategy/strategy-step'
import { createQueryClient } from '@/shared/api/query-client'
import type { SimulateRequest, Stint } from '@/shared/api/types'
import { AppShell } from '@/shared/layout/app-shell'

interface AppProps {
  client?: QueryClient
}

interface BuilderDraft {
  raceId: string
  stints: Stint[]
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

function Screen() {
  const { t } = useTranslation()
  const { raceId, driverId, selectRace, selectDriver } = useRaceSelection()
  const overview = useRaceOverview(raceId).data
  const { view, run, retry } = useSimulation(raceId, driverId)
  const [draft, setDraft] = useState<BuilderDraft | null>(null)
  const raceLaps = overview?.race.laps ?? 0
  const lap = useSimulationProgress(view.kind === 'loading', raceLaps)
  const progress = lap === null || raceLaps === 0 ? null : lap / raceLaps

  const rememberStints = useCallback(
    (draftRaceId: string, stints: Stint[]) => setDraft({ raceId: draftRaceId, stints }),
    [],
  )

  function simulate(request: SimulateRequest) {
    run(request)
    scrollToSection('step-result')
  }

  return (
    <AppShell>
      <div>
        <RacesStep selectedId={raceId} onSelect={selectRace} />
        <RaceInfoStep raceId={raceId} driverId={driverId} onSelectDriver={selectDriver} />
        <StrategyStep
          raceId={raceId}
          driverId={driverId}
          onSelectDriver={selectDriver}
          onSimulate={simulate}
          onStintsChange={rememberStints}
          simulationProgress={progress}
        />
        <ResultStep
          view={view}
          overview={overview}
          builderStints={draft !== null && draft.raceId === raceId ? draft.stints : null}
          lap={lap}
          onRetry={retry}
          onBackToStrategy={focusStint}
          onBackToCalendar={() => scrollToSection('step-race')}
        />
        <p className="mt-12 text-caption text-ink-faint">{t('app.footer')}</p>
      </div>
    </AppShell>
  )
}

function App({ client }: AppProps) {
  const [defaultClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={client ?? defaultClient}>
      <Screen />
    </QueryClientProvider>
  )
}

export default App
