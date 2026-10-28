export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET'

export type StrategyViolationCode =
  'NO_STINTS' | 'STINT_TOO_SHORT' | 'UNKNOWN_COMPOUND' | 'LAPS_MISMATCH' | 'NOT_ENOUGH_PIT_STOPS'

export interface StrategyViolation {
  code: StrategyViolationCode
  field?: string
  params: Record<string, string | number>
  message: string
}

export interface ErrorResponse {
  statusCode: number
  code: string
  message: string
  details?: unknown
}

export interface RaceListItem {
  id: string
  name: string
  round: number
  date: string
  laps: number
  temperature: number
  rainProbability: number
  circuit: { id: string; name: string; country: string; type: string }
}

export interface RaceListResponse {
  races: RaceListItem[]
}

export interface Circuit {
  id: string
  name: string
  country: string
  type: string
  laps: number
  lengthKm: number
  baseLapTime: number
  pitStopLoss: number
  tyreWear: number
  overtakingDifficulty: number
}

export interface WeatherSegment {
  fromLap: number
  toLap: number
  temperature: number
  rainIntensity: number
}

export interface Tyre {
  compound: TyreCompound
  pace: number
  degradation: number
  wetPerformance: number
  optimalRainIntensity: { min: number; max: number }
}

export interface RaceOverviewDriver {
  id: string
  name: string
  number: number
  pace: number
  consistency: number
}

export interface RaceOverviewTeam {
  id: string
  name: string
  carPerformance: number
  drivers: RaceOverviewDriver[]
}

export interface RaceOverview {
  race: Omit<RaceListItem, 'circuit'>
  circuit: Circuit
  weather: { summary: string; forecast: WeatherSegment[] }
  parameters: {
    lapTimeVariance: number
    pitStopLoss: number
    tyreChangeTime: number
    fuelEffectPerLap: number
    safetyCarProbability: number
    minimumPitStops: number
  }
  tyres: Tyre[]
  teams: RaceOverviewTeam[]
}

export interface Stint {
  compound: string
  laps: number
}

export interface SimulateRequest {
  raceId: string
  driverId: string
  stints: Stint[]
}

export interface StintResult {
  index: number
  compound: TyreCompound
  startLap: number
  endLap: number
  laps: number
  time: number
  averageLapTime: number
  rainLoss: number
}

export interface PitStop {
  lap: number
  fromCompound: TyreCompound
  toCompound: TyreCompound
  pitLaneLoss: number
  tyreChangeTime: number
  totalLoss: number
}

export interface LapResult {
  lap: number
  stintIndex: number
  compound: TyreCompound
  tyreAge: number
  rainIntensity: number
  rainPenalty: number
  pitLoss: number
  time: number
}

export interface SimulationResult {
  raceId: string
  driverId: string
  totalTime: number
  driverDelta: number
  stints: StintResult[]
  pitStops: PitStop[]
  laps: LapResult[]
}
