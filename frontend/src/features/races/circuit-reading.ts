import { formatPercent } from './format'

export type ReadingKey =
  'highWear' | 'lowWear' | 'hardOvertaking' | 'rain' | 'safetyCar' | 'balanced'

export interface ReadingItem {
  key: ReadingKey
  value?: string
}

interface ReadingInput {
  tyreWear: number
  overtakingDifficulty: number
  rainProbability: number
  safetyCarProbability: number
}

export function circuitReading(input: ReadingInput): ReadingItem[] {
  const items: ReadingItem[] = []
  if (input.tyreWear >= 1.2) items.push({ key: 'highWear', value: String(input.tyreWear) })
  else if (input.tyreWear <= 0.9) items.push({ key: 'lowWear', value: String(input.tyreWear) })
  if (input.overtakingDifficulty >= 0.8) {
    items.push({ key: 'hardOvertaking', value: String(input.overtakingDifficulty) })
  }
  if (input.rainProbability >= 0.5) {
    items.push({ key: 'rain', value: formatPercent(input.rainProbability) })
  }
  if (input.safetyCarProbability >= 0.5) {
    items.push({ key: 'safetyCar', value: formatPercent(input.safetyCarProbability) })
  }
  return items.length > 0 ? items : [{ key: 'balanced' }]
}
