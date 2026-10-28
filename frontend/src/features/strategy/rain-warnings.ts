import type { Stint, Tyre, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { TYRE_COMPOUNDS, isTyreCompound } from '@/shared/domain/compounds'

export interface RainWarning {
  stintIndex: number
  compound: TyreCompound
  fromLap: number
  toLap: number
  rainIntensity: number
  lossPerLap: number
  idealCompound: TyreCompound | null
}

const ABOVE_BAND_FACTOR = 20
const BELOW_BAND_FACTOR = 6

export function rainLossPerLap(tyre: Tyre, rainIntensity: number): number {
  const { min, max } = tyre.optimalRainIntensity
  if (rainIntensity > max)
    return (rainIntensity - max) * ABOVE_BAND_FACTOR * (1 - tyre.wetPerformance)
  if (rainIntensity < min) return (min - rainIntensity) * BELOW_BAND_FACTOR
  return 0
}

function order(compound: TyreCompound): number {
  return TYRE_COMPOUNDS.indexOf(compound)
}

function idealTyre(tyres: Tyre[], rainIntensity: number): Tyre | undefined {
  return tyres
    .map((tyre) => ({ tyre, loss: rainLossPerLap(tyre, rainIntensity) }))
    .sort(
      (a, b) =>
        a.loss - b.loss ||
        a.tyre.pace - b.tyre.pace ||
        order(a.tyre.compound) - order(b.tyre.compound),
    )[0]?.tyre
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

    forecast.forEach((segment) => {
      const fromLap = Math.max(firstLap, segment.fromLap)
      const toLap = Math.min(lastLap, segment.toLap)
      if (fromLap > toLap) return
      const lossPerLap = rainLossPerLap(tyre, segment.rainIntensity)
      if (lossPerLap <= 0) return
      const ideal = idealTyre(tyres, segment.rainIntensity)
      warnings.push({
        stintIndex,
        compound,
        fromLap,
        toLap,
        rainIntensity: segment.rainIntensity,
        lossPerLap,
        idealCompound: ideal !== undefined && ideal.compound !== compound ? ideal.compound : null,
      })
    })
  })

  return warnings
}
