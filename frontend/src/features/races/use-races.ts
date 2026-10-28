import { useQuery } from '@tanstack/react-query'
import { getRaces } from '@/shared/api/races-api'

export const RACES_QUERY_KEY = ['races'] as const

export function useRaces() {
  return useQuery({
    queryKey: RACES_QUERY_KEY,
    queryFn: ({ signal }) => getRaces(signal),
  })
}
