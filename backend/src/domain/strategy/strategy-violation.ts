export type StrategyViolationCode =
  | 'NO_STINTS'
  | 'STINT_TOO_SHORT'
  | 'UNKNOWN_COMPOUND'
  | 'LAPS_MISMATCH'
  | 'NOT_ENOUGH_PIT_STOPS';

export interface StrategyViolation {
  code: StrategyViolationCode;
  field?: string;
  params: Record<string, string | number>;
  message: string;
}
