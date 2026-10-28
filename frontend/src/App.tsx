import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RacesStepPlaceholder } from '@/features/races/races-step-placeholder'
import { createQueryClient } from '@/shared/api/query-client'
import { AppShell } from '@/shared/layout/app-shell'

interface AppProps {
  client?: QueryClient
}

function App({ client }: AppProps) {
  const [defaultClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={client ?? defaultClient}>
      <AppShell activeStep={1}>
        <RacesStepPlaceholder />
      </AppShell>
    </QueryClientProvider>
  )
}

export default App
