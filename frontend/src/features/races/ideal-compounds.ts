import type { Tyre, TyreCompound, WeatherSegment } from '@/shared/api/types'
import { TYRE_COMPOUNDS } from '@/shared/domain/compounds'

function contains(tyre: Tyre, rainIntensity: number): boolean {
  const { min, max } = tyre.optimalRainIntensity
  return rainIntensity >= min && rainIntensity <= max
}

export function idealCompounds(tyres: Tyre[], rainIntensity: number): TyreCompound[] {
  return TYRE_COMPOUNDS.filter((compound) =>
    tyres.some((tyre) => tyre.compound === compound && contains(tyre, rainIntensity)),
  )
}

export function fitsAnySegment(tyre: Tyre, forecast: WeatherSegment[]): boolean {
  return forecast.some((segment) => contains(tyre, segment.rainIntensity))
}

export function rainMarks(forecast: WeatherSegment[]): number[] {
  return [...new Set(forecast.map((segment) => segment.rainIntensity))]
}
