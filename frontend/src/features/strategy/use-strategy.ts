import { useCallback, useMemo, useState } from 'react'
import type { RaceOverview, Stint } from '@/shared/api/types'
import { validateStrategy } from './validate-strategy'

const FIRST_STINT_SHARE = 0.45

export function defaultStints(raceLaps: number): Stint[] {
  const first = Math.min(raceLaps, Math.max(1, Math.floor(raceLaps * FIRST_STINT_SHARE)))
  return [
    { compound: 'MEDIUM', laps: first },
    { compound: 'HARD', laps: raceLaps - first },
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
  const stints = draft !== null && draft.raceId === raceId ? draft.stints : defaultStints(raceLaps)

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

  const addStint = useCallback(
    () =>
      update((current) => {
        const last = current.at(-1)
        const moved = last === undefined ? 0 : Math.floor(last.laps / 2)
        const head =
          last === undefined ? [] : [...current.slice(0, -1), { ...last, laps: last.laps - moved }]
        return [...head, { compound: 'MEDIUM', laps: moved }]
      }),
    [update],
  )

  const removeStint = useCallback(
    (index: number) =>
      update((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current)),
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

  return { stints, validation, setCompound, setLaps, addStint, removeStint }
}
