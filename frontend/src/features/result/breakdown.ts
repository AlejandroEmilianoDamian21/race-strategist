import type { PitStop, SimulationResult, StintResult } from '@/shared/api/types'

export const RAIN_LOSS_THRESHOLD = 1

export type BreakdownRow = { kind: 'stint'; stint: StintResult } | { kind: 'pit'; stop: PitStop }

export function hasRainLoss(loss: number): boolean {
  return loss > RAIN_LOSS_THRESHOLD
}

export function breakdownRows(result: SimulationResult): BreakdownRow[] {
  return result.stints.flatMap((stint): BreakdownRow[] => {
    const stop = result.pitStops.find((candidate) => candidate.lap === stint.endLap)
    return stop === undefined
      ? [{ kind: 'stint', stint }]
      : [
          { kind: 'stint', stint },
          { kind: 'pit', stop },
        ]
  })
}

export function breakdownTotals(result: SimulationResult): { laps: number; time: number } {
  return { laps: result.laps.length, time: result.totalTime }
}
