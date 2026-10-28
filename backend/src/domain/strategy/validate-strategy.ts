import { InvalidStrategyError } from '../errors/invalid-strategy.error.js';
import type { Stint } from '../model/strategy.js';
import { TYRE_COMPOUNDS, isTyreCompound } from '../model/tyre.js';
import type { StrategyViolation } from './strategy-violation.js';

export interface StrategyRules {
  raceLaps: number;
  minimumPitStops: number;
}

function validateStint(stint: Stint, index: number): StrategyViolation[] {
  const violations: StrategyViolation[] = [];
  const number = index + 1;

  if (!Number.isInteger(stint.laps) || stint.laps < 1) {
    violations.push({
      code: 'STINT_TOO_SHORT',
      field: `stints[${index}].laps`,
      params: { stint: number, laps: stint.laps },
      message: `Stint ${number} must have at least 1 whole lap (got ${stint.laps}).`,
    });
  }

  if (!isTyreCompound(stint.compound)) {
    const allowed = TYRE_COMPOUNDS.join(', ');
    violations.push({
      code: 'UNKNOWN_COMPOUND',
      field: `stints[${index}].compound`,
      params: { stint: number, compound: stint.compound, allowed },
      message: `Stint ${number} uses unknown compound "${stint.compound}". Allowed: ${allowed}.`,
    });
  }

  return violations;
}

export function validateStrategy(
  stints: Stint[],
  rules: StrategyRules,
): StrategyViolation[] {
  if (stints.length === 0) {
    return [
      {
        code: 'NO_STINTS',
        field: 'stints',
        params: {},
        message: 'The strategy needs at least one stint.',
      },
    ];
  }

  const violations = stints.flatMap(validateStint);

  const actualLaps = stints.reduce((sum, stint) => sum + stint.laps, 0);
  if (actualLaps !== rules.raceLaps) {
    violations.push({
      code: 'LAPS_MISMATCH',
      field: 'stints',
      params: {
        expected: rules.raceLaps,
        actual: actualLaps,
        difference: rules.raceLaps - actualLaps,
      },
      message: `Stints add up to ${actualLaps} laps but the race has ${rules.raceLaps}.`,
    });
  }

  const pitStops = stints.length - 1;
  if (pitStops < rules.minimumPitStops) {
    violations.push({
      code: 'NOT_ENOUGH_PIT_STOPS',
      field: 'stints',
      params: { required: rules.minimumPitStops, actual: pitStops },
      message: `At least ${rules.minimumPitStops} pit stop(s) required but the strategy has ${pitStops}.`,
    });
  }

  return violations;
}

export function assertValidStrategy(
  stints: Stint[],
  rules: StrategyRules,
): void {
  const violations = validateStrategy(stints, rules);
  if (violations.length > 0) {
    throw new InvalidStrategyError(violations);
  }
}
