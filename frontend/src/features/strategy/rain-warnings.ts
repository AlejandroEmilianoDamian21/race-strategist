import { idealCompounds } from '@/features/races/ideal-compounds'
import type { Stint, Tyre, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { isTyreCompound } from '@/shared/domain/compounds'

export interface RainWarning {
  stintIndex: number
  compound: TyreCompound
  fromLap: number
  toLap: number
  rainIntensity: number
  band: { min: number; max: number }
  lossPerLap: number
  idealCompounds: TyreCompound[]
}

const ABOVE_BAND_FACTOR = 20
const BELOW_BAND_FACTOR = 6
const MIN_REPORTED_LOSS = 0.5

export function rainLossPerLap(tyre: Tyre, rainIntensity: number): number {
  const { min, max } = tyre.optimalRainIntensity
  if (rainIntensity > max)
    return (rainIntensity - max) * ABOVE_BAND_FACTOR * (1 - tyre.wetPerformance)
  if (rainIntensity < min) return (min - rainIntensity) * BELOW_BAND_FACTOR
  return 0
}

export function rainWarnings(
  stints: Stint[],
  forecast: WeatherSegment[],
  tyres: Tyre[],
): RainWarning[] {
  const warnings: RainWarning[] = []
  let startLap = 1

  stints.forEach((stint, stintIndex) => {
    if (!Number.isInteger(stint.laps) || stint.laps < 1) return
    const firstLap = startLap
    const lastLap = startLap + stint.laps - 1
    startLap = lastLap + 1

    const compound = stint.compound
    if (!isTyreCompound(compound)) return
    const tyre = tyres.find((candidate) => candidate.compound === compound)
    if (tyre === undefined) return

    const worst = forecast
      .filter((segment) => segment.toLap >= firstLap && segment.fromLap <= lastLap)
      .map((segment) => ({ segment, loss: rainLossPerLap(tyre, segment.rainIntensity) }))
      .filter(({ loss }) => loss > MIN_REPORTED_LOSS)
      .reduce<{ segment: WeatherSegment; loss: number } | null>(
        (best, candidate) => (best === null || candidate.loss > best.loss ? candidate : best),
        null,
      )
    if (worst === null) return

    const { segment, loss } = worst
    warnings.push({
      stintIndex,
      compound,
      fromLap: Math.max(firstLap, segment.fromLap),
      toLap: Math.min(lastLap, segment.toLap),
      rainIntensity: segment.rainIntensity,
      band: tyre.optimalRainIntensity,
      lossPerLap: loss,
      idealCompounds: idealCompounds(tyres, segment.rainIntensity),
    })
  })

  return warnings
}
