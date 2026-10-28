import { InvalidStrategyError } from '../errors/invalid-strategy.error.js';
import { assertValidStrategy, validateStrategy } from './validate-strategy.js';

const rules = { raceLaps: 50, minimumPitStops: 1 };

describe('validateStrategy', () => {
  it('returns no violations for a valid strategy', () => {
    const stints = [
      { compound: 'SOFT', laps: 20 },
      { compound: 'HARD', laps: 30 },
    ];
    expect(validateStrategy(stints, rules)).toEqual([]);
  });

  it('reports missing laps when stints do not add up', () => {
    const stints = [
      { compound: 'SOFT', laps: 20 },
      { compound: 'HARD', laps: 25 },
    ];
    const [violation] = validateStrategy(stints, rules);
    expect(violation?.code).toBe('LAPS_MISMATCH');
    expect(violation?.field).toBe('stints');
    expect(violation?.params).toEqual({
      expected: 50,
      actual: 45,
      difference: 5,
    });
  });

  it('reports extra laps with a negative difference', () => {
    const stints = [
      { compound: 'SOFT', laps: 30 },
      { compound: 'HARD', laps: 30 },
    ];
    const [violation] = validateStrategy(stints, rules);
    expect(violation?.params).toEqual({
      expected: 50,
      actual: 60,
      difference: -10,
    });
  });

  it('rejects a stint with zero laps', () => {
    const stints = [
      { compound: 'SOFT', laps: 0 },
      { compound: 'HARD', laps: 50 },
    ];
    const violations = validateStrategy(stints, rules);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      code: 'STINT_TOO_SHORT',
      field: 'stints[0].laps',
      params: { stint: 1, laps: 0 },
    });
  });

  it('rejects non-integer laps', () => {
    const stints = [
      { compound: 'SOFT', laps: 20.5 },
      { compound: 'HARD', laps: 29.5 },
    ];
    const codes = validateStrategy(stints, rules).map((v) => v.code);
    expect(codes).toEqual(['STINT_TOO_SHORT', 'STINT_TOO_SHORT']);
  });

  it('rejects an unknown compound', () => {
    const stints = [
      { compound: 'SUPERSOFT', laps: 20 },
      { compound: 'HARD', laps: 30 },
    ];
    const violations = validateStrategy(stints, rules);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      code: 'UNKNOWN_COMPOUND',
      field: 'stints[0].compound',
      params: {
        stint: 1,
        compound: 'SUPERSOFT',
        allowed: 'SOFT, MEDIUM, HARD, INTERMEDIATE, WET',
      },
    });
  });

  it('requires the minimum number of pit stops', () => {
    const violations = validateStrategy(
      [{ compound: 'SOFT', laps: 50 }],
      rules,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      code: 'NOT_ENOUGH_PIT_STOPS',
      field: 'stints',
      params: { required: 1, actual: 0 },
    });
  });

  it('reports NO_STINTS and stops for an empty strategy', () => {
    const violations = validateStrategy([], rules);
    expect(violations.map((v) => v.code)).toEqual(['NO_STINTS']);
  });

  it('collects every violation together', () => {
    const violations = validateStrategy(
      [{ compound: 'SUPERSOFT', laps: 0 }],
      rules,
    );
    expect(violations.map((v) => v.code).sort()).toEqual([
      'LAPS_MISMATCH',
      'NOT_ENOUGH_PIT_STOPS',
      'STINT_TOO_SHORT',
      'UNKNOWN_COMPOUND',
    ]);
    expect(violations.every((v) => v.message.length > 0)).toBe(true);
  });
});

describe('assertValidStrategy', () => {
  it('does not throw for a valid strategy', () => {
    const stints = [
      { compound: 'SOFT', laps: 20 },
      { compound: 'HARD', laps: 30 },
    ];
    expect(() => assertValidStrategy(stints, rules)).not.toThrow();
  });

  it('throws InvalidStrategyError carrying the violations', () => {
    let caught: unknown;
    try {
      assertValidStrategy([], rules);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InvalidStrategyError);
    const error = caught as InvalidStrategyError;
    expect(error.code).toBe('INVALID_STRATEGY');
    expect(error.violations.map((v) => v.code)).toEqual(['NO_STINTS']);
  });
});
