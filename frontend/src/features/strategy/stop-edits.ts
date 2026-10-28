import { idealCompounds } from '@/features/races/ideal-compounds'
import type { Stint, Tyre, WeatherSegment } from '@/shared/api/types'

function lapsOf(stint: Stint): number {
  return Number.isFinite(stint.laps) && stint.laps > 0 ? stint.laps : 0
}

function rainAt(forecast: WeatherSegment[], lap: number): number {
  const segment = forecast.find((candidate) => lap >= candidate.fromLap && lap <= candidate.toLap)
  return (segment ?? forecast.at(-1))?.rainIntensity ?? 0
}

export function splitLongestStint(
  stints: Stint[],
  forecast: WeatherSegment[],
  tyres: Tyre[],
): Stint[] {
  let longest = 0
  stints.forEach((stint, index) => {
    if (lapsOf(stint) > lapsOf(stints[longest] as Stint)) longest = index
  })

  const source = stints[longest]
  if (source === undefined) return stints
  const total = lapsOf(source)
  if (total < 2) return stints

  const moved = Math.floor(total / 2)
  const kept = total - moved
  const before = stints.slice(0, longest).reduce((sum, stint) => sum + lapsOf(stint), 0)
  const middle = before + kept + Math.ceil(moved / 2)
  const ideal = idealCompounds(tyres, rainAt(forecast, middle)).filter(
    (compound) => compound !== source.compound,
  )
  const compound = ideal[0] ?? (source.compound === 'HARD' ? 'MEDIUM' : 'HARD')

  return [
    ...stints.slice(0, longest),
    { ...source, laps: kept },
    { compound, laps: moved },
    ...stints.slice(longest + 1),
  ]
}

export function removeStint(stints: Stint[], index: number): Stint[] {
  const removed = stints[index]
  if (removed === undefined || stints.length <= 1) return stints
  const remaining = stints.filter((_, position) => position !== index)
  const receiver = index > 0 ? index - 1 : 0
  return remaining.map((stint, position) =>
    position === receiver ? { ...stint, laps: lapsOf(stint) + lapsOf(removed) } : stint,
  )
}
