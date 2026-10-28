import { useQuery } from '@tanstack/react-query'
import { getRaces } from '@/shared/api/races-api'

export function useRaces() {
  return useQuery({ queryKey: ['races'], queryFn: getRaces })
}
