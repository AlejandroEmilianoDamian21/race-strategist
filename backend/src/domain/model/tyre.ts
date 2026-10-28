export const TYRE_COMPOUNDS = [
  'SOFT',
  'MEDIUM',
  'HARD',
  'INTERMEDIATE',
  'WET',
] as const;

export type TyreCompound = (typeof TYRE_COMPOUNDS)[number];

export function isTyreCompound(value: unknown): value is TyreCompound {
  return TYRE_COMPOUNDS.some((compound) => compound === value);
}

export interface Tyre {
  compound: TyreCompound;
  pace: number;
  degradation: number;
  wetPerformance: number;
  optimalRainIntensity: { min: number; max: number };
}
