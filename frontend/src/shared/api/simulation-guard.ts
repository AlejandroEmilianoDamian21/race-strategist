import { isTyreCompound } from '@/shared/domain/compounds'
import type { SimulationResult } from './types'

type Shape = Record<string, unknown>

function isRecord(value: unknown): value is Shape {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasNumbers(record: Shape, keys: string[]): boolean {
  return keys.every((key) => isNumber(record[key]))
}

function hasCompounds(record: Shape, keys: string[]): boolean {
  return keys.every((key) => typeof record[key] === 'string' && isTyreCompound(record[key]))
}

function everyRecord(value: unknown, check: (item: Shape) => boolean): boolean {
  return Array.isArray(value) && value.every((item) => isRecord(item) && check(item))
}

const STINT_NUMBERS = ['index', 'startLap', 'endLap', 'laps', 'time', 'averageLapTime', 'rainLoss']
const PIT_NUMBERS = ['lap', 'pitLaneLoss', 'tyreChangeTime', 'totalLoss']
const LAP_NUMBERS = [
  'lap',
  'stintIndex',
  'tyreAge',
  'rainIntensity',
  'rainPenalty',
  'pitLoss',
  'time',
]

export function isSimulationResult(value: unknown): value is SimulationResult {
  if (!isRecord(value)) return false
  return (
    typeof value.raceId === 'string' &&
    typeof value.driverId === 'string' &&
    hasNumbers(value, ['totalTime', 'driverDelta']) &&
    everyRecord(
      value.stints,
      (stint) => hasNumbers(stint, STINT_NUMBERS) && hasCompounds(stint, ['compound']),
    ) &&
    everyRecord(
      value.pitStops,
      (stop) => hasNumbers(stop, PIT_NUMBERS) && hasCompounds(stop, ['fromCompound', 'toCompound']),
    ) &&
    everyRecord(
      value.laps,
      (lap) => hasNumbers(lap, LAP_NUMBERS) && hasCompounds(lap, ['compound']),
    )
  )
}
