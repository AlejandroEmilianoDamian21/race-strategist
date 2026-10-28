import type {
  LapResult,
  PitStop,
  SimulationResult,
  StintResult,
  TyreCompound,
} from '@/shared/api/types'

export interface PlannedStint {
  compound: TyreCompound
  laps: number
  base: number
  rain?: number
  rainPenalty?: number
}

export const PIT_LOSS = 22

export function buildResult(plan: PlannedStint[], raceId = 'italian-gp'): SimulationResult {
  const laps: LapResult[] = []
  const stints: StintResult[] = []
  const pitStops: PitStop[] = []
  plan.forEach((planned, stintIndex) => {
    const startLap = laps.length + 1
    const stintLaps: LapResult[] = []
    for (let age = 0; age < planned.laps; age++) {
      const isPit = age === planned.laps - 1 && stintIndex < plan.length - 1
      const rainPenalty = planned.rainPenalty ?? 0
      const pitLoss = isPit ? PIT_LOSS : 0
      stintLaps.push({
        lap: startLap + age,
        stintIndex,
        compound: planned.compound,
        tyreAge: age + 1,
        rainIntensity: planned.rain ?? 0,
        rainPenalty,
        pitLoss,
        time: planned.base + age * 0.1 + rainPenalty + pitLoss,
      })
      if (isPit) {
        pitStops.push({
          lap: startLap + age,
          fromCompound: planned.compound,
          toCompound: plan[stintIndex + 1]!.compound,
          pitLaneLoss: 19.5,
          tyreChangeTime: 2.5,
          totalLoss: PIT_LOSS,
        })
      }
    }
    const time = stintLaps.reduce((sum, lap) => sum + lap.time - lap.pitLoss, 0)
    stints.push({
      index: stintIndex,
      compound: planned.compound,
      startLap,
      endLap: startLap + planned.laps - 1,
      laps: planned.laps,
      time,
      averageLapTime: time / planned.laps,
      rainLoss: stintLaps.reduce((sum, lap) => sum + lap.rainPenalty, 0),
    })
    laps.push(...stintLaps)
  })
  return {
    raceId,
    driverId: 'leclerc',
    totalTime: laps.reduce((sum, lap) => sum + lap.time, 0),
    driverDelta: 0.3,
    stints,
    pitStops,
    laps,
  }
}

export const TWO_STOPS: PlannedStint[] = [
  { compound: 'MEDIUM', laps: 4, base: 80 },
  { compound: 'INTERMEDIATE', laps: 3, base: 78, rain: 0.35, rainPenalty: 0 },
  { compound: 'WET', laps: 3, base: 79, rain: 0.35, rainPenalty: 1.5 },
]

export const ONE_STOP: PlannedStint[] = [
  { compound: 'HARD', laps: 6, base: 82 },
  { compound: 'SOFT', laps: 4, base: 80 },
]

export const NO_STOP: PlannedStint[] = [{ compound: 'HARD', laps: 5, base: 81 }]
