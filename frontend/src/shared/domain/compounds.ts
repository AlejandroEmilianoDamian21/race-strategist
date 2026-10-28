import type { TyreCompound } from '@/shared/api/types'

export interface CompoundInfo {
  api: TyreCompound
  letter: string
  nameKey: string
}

export const COMPOUNDS: readonly CompoundInfo[] = [
  { api: 'SOFT', letter: 'S', nameKey: 'compounds.SOFT' },
  { api: 'MEDIUM', letter: 'M', nameKey: 'compounds.MEDIUM' },
  { api: 'HARD', letter: 'H', nameKey: 'compounds.HARD' },
  { api: 'INTERMEDIATE', letter: 'I', nameKey: 'compounds.INTERMEDIATE' },
  { api: 'WET', letter: 'W', nameKey: 'compounds.WET' },
]

export const TYRE_COMPOUNDS: readonly TyreCompound[] = COMPOUNDS.map((compound) => compound.api)

export function isTyreCompound(value: string): value is TyreCompound {
  return TYRE_COMPOUNDS.some((compound) => compound === value)
}

function infoFor(compound: TyreCompound): CompoundInfo {
  const info = COMPOUNDS.find((entry) => entry.api === compound)
  if (!info) throw new Error(`Unknown compound ${compound}`)
  return info
}

export function compoundLetter(compound: TyreCompound): string {
  return infoFor(compound).letter
}

export function compoundNameKey(compound: TyreCompound): string {
  return infoFor(compound).nameKey
}
