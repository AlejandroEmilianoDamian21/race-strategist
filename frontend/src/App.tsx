import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RaceInfoStep } from '@/features/races/race-info-step'
import { RacesStep } from '@/features/races/races-step'
import { useRaceSelection } from '@/features/races/use-race-selection'
import { createQueryClient } from '@/shared/api/query-client'
import { AppShell } from '@/shared/layout/app-shell'

interface AppProps {
  client?: QueryClient
}

function App({ client }: AppProps) {
  const [defaultClient] = useState(createQueryClient)
  const { raceId, driverId, selectRace, selectDriver } = useRaceSelection()

  return (
    <QueryClientProvider client={client ?? defaultClient}>
      <AppShell activeStep={raceId === null ? 1 : 2}>
        <div className="flex flex-col gap-12">
          <RacesStep selectedId={raceId} onSelect={selectRace} />
          <RaceInfoStep raceId={raceId} driverId={driverId} onSelectDriver={selectDriver} />
        </div>
      </AppShell>
    </QueryClientProvider>
  )
}

export default App
