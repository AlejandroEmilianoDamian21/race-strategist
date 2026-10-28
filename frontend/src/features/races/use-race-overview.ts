import { useQuery } from '@tanstack/react-query'
import { getRaceOverview } from '@/shared/api/races-api'

export function raceOverviewKey(raceId: string | null) {
  return ['races', raceId, 'overview'] as const
}

export function useRaceOverview(raceId: string | null) {
  return useQuery({
    queryKey: raceOverviewKey(raceId),
    queryFn: ({ signal }) => getRaceOverview(raceId as string, signal),
    enabled: raceId !== null,
  })
}
