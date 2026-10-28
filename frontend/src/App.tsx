import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RaceInfoStep } from '@/features/races/race-info-step'
import { RacesStep } from '@/features/races/races-step'
import { useRaceSelection } from '@/features/races/use-race-selection'
import { StrategyStep } from '@/features/strategy/strategy-step'
import { createQueryClient } from '@/shared/api/query-client'
import type { SimulateRequest } from '@/shared/api/types'
import { AppShell } from '@/shared/layout/app-shell'

interface AppProps {
  client?: QueryClient
}

function App({ client }: AppProps) {
  const [defaultClient] = useState(createQueryClient)
  const { raceId, driverId, selectRace, selectDriver } = useRaceSelection()
  const [, setLastRequest] = useState<SimulateRequest | null>(null)
  const activeStep = raceId === null ? 1 : driverId === null ? 2 : 3

  return (
    <QueryClientProvider client={client ?? defaultClient}>
      <AppShell activeStep={activeStep}>
        <div className="flex flex-col gap-12">
          <RacesStep selectedId={raceId} onSelect={selectRace} />
          <RaceInfoStep raceId={raceId} driverId={driverId} onSelectDriver={selectDriver} />
          <StrategyStep
            raceId={raceId}
            driverId={driverId}
            onSelectDriver={selectDriver}
            onSimulate={setLastRequest}
          />
        </div>
      </AppShell>
    </QueryClientProvider>
  )
}

export default App
