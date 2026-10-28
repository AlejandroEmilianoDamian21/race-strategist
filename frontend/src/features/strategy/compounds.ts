import type { TyreCompound } from '@/shared/api/types'

export const TYRE_COMPOUNDS: readonly TyreCompound[] = [
  'SOFT',
  'MEDIUM',
  'HARD',
  'INTERMEDIATE',
  'WET',
]

export function isTyreCompound(value: string): value is TyreCompound {
  return TYRE_COMPOUNDS.some((compound) => compound === value)
}
