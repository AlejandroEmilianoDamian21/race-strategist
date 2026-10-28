import { useCallback, useMemo, useState } from 'react'
import type { RaceOverview, Stint } from '@/shared/api/types'
import { movePit as movePitIn } from './pit-lap'
import { removeStint as removeStintIn, splitLongestStint } from './stop-edits'
import { validateStrategy } from './validate-strategy'

export function defaultStints(raceLaps: number): Stint[] {
  const second = Math.floor(raceLaps / 2)
  return [
    { compound: 'MEDIUM', laps: raceLaps - second },
    { compound: 'HARD', laps: second },
  ]
}

interface Draft {
  raceId: string
  stints: Stint[]
}

export function useStrategy(overview: RaceOverview) {
  const raceId = overview.race.id
  const raceLaps = overview.race.laps
  const [draft, setDraft] = useState<Draft | null>(null)
  const stints = useMemo(
    () => (draft !== null && draft.raceId === raceId ? draft.stints : defaultStints(raceLaps)),
    [draft, raceId, raceLaps],
  )

  const update = useCallback(
    (change: (current: Stint[]) => Stint[]) => {
      setDraft((previous) => {
        const current =
          previous !== null && previous.raceId === raceId
            ? previous.stints
            : defaultStints(raceLaps)
        return { raceId, stints: change(current) }
      })
    },
    [raceId, raceLaps],
  )

  const setCompound = useCallback(
    (index: number, compound: string) =>
      update((current) =>
        current.map((stint, i) => (i === index ? { ...stint, compound } : stint)),
      ),
    [update],
  )

  const setLaps = useCallback(
    (index: number, laps: number) =>
      update((current) => current.map((stint, i) => (i === index ? { ...stint, laps } : stint))),
    [update],
  )

  const addStop = useCallback(
    () =>
      update((current) => splitLongestStint(current, overview.weather.forecast, overview.tyres)),
    [update, overview.weather.forecast, overview.tyres],
  )

  const removeStint = useCallback(
    (index: number) => update((current) => removeStintIn(current, index)),
    [update],
  )

  const movePit = useCallback(
    (index: number, lap: number) => update((current) => movePitIn(current, index, lap)),
    [update],
  )

  const validation = useMemo(
    () =>
      validateStrategy(stints, {
        raceLaps,
        minimumPitStops: overview.parameters.minimumPitStops,
        forecast: overview.weather.forecast,
        tyres: overview.tyres,
      }),
    [
      stints,
      raceLaps,
      overview.parameters.minimumPitStops,
      overview.weather.forecast,
      overview.tyres,
    ],
  )

  return { stints, validation, setCompound, setLaps, addStop, removeStint, movePit }
}
