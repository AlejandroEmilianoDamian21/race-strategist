import { useCallback, useState } from 'react'

interface Selection {
  raceId: string | null
  driverId: string | null
}

export function useRaceSelection() {
  const [selection, setSelection] = useState<Selection>({ raceId: null, driverId: null })

  const selectRace = useCallback((raceId: string) => {
    setSelection((current) => (current.raceId === raceId ? current : { raceId, driverId: null }))
  }, [])

  const selectDriver = useCallback((driverId: string) => {
    setSelection((current) => ({ ...current, driverId }))
  }, [])

  return { ...selection, selectRace, selectDriver }
}
