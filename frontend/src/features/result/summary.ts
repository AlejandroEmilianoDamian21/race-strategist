import type { SimulationResult, TyreCompound } from '@/shared/api/types'
import { RAIN_LOSS_THRESHOLD } from './breakdown'

export interface ResultSummaryData {
  stops: number
  compounds: TyreCompound[]
  pitLaps: number[]
  longest: { compound: TyreCompound; laps: number }
  wetLoss: number
  hasWetLoss: boolean
  pitLossTotal: number
  bestLap: { lap: number; compound: TyreCompound; time: number }
  averageLap: number
  totalLaps: number
  delta: number | null
}

export function summarize(
  result: SimulationResult,
  previous: SimulationResult | null,
): ResultSummaryData {
  const longestStint = result.stints.reduce((best, stint) =>
    stint.laps > best.laps ? stint : best,
  )
  const wetLoss = result.stints.reduce((sum, stint) => sum + stint.rainLoss, 0)
  const cleanLaps = result.laps.filter((lap) => lap.pitLoss === 0)
  const bestLap = (cleanLaps.length > 0 ? cleanLaps : result.laps).reduce((best, lap) =>
    lap.time < best.time ? lap : best,
  )
  return {
    stops: result.pitStops.length,
    compounds: result.stints.map((stint) => stint.compound),
    pitLaps: result.pitStops.map((stop) => stop.lap),
    longest: { compound: longestStint.compound, laps: longestStint.laps },
    wetLoss,
    hasWetLoss: wetLoss > RAIN_LOSS_THRESHOLD,
    pitLossTotal: result.pitStops.reduce((sum, stop) => sum + stop.totalLoss, 0),
    bestLap: { lap: bestLap.lap, compound: bestLap.compound, time: bestLap.time },
    averageLap: result.totalTime / result.laps.length,
    totalLaps: result.laps.length,
    delta: previous === null ? null : result.totalTime - previous.totalTime,
  }
}
