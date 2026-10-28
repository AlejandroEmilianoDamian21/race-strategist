import { InvalidStrategyError } from '../errors/invalid-strategy.error.js';
import type { Strategy } from '../model/strategy.js';
import type { Tyre } from '../model/tyre.js';
import type { SimulationContext } from './simulation-context.js';
import { simulateRace } from './simulate-race.js';

const tyres: Tyre[] = [
  {
    compound: 'SOFT',
    pace: -1,
    degradation: 0.5,
    wetPerformance: 0,
    optimalRainIntensity: { min: 0, max: 0.1 },
  },
  {
    compound: 'MEDIUM',
    pace: -0.5,
    degradation: 0.3,
    wetPerformance: 0,
    optimalRainIntensity: { min: 0, max: 0.1 },
  },
  {
    compound: 'HARD',
    pace: 0,
    degradation: 0.1,
    wetPerformance: 0,
    optimalRainIntensity: { min: 0, max: 0.1 },
  },
  {
    compound: 'INTERMEDIATE',
    pace: 1,
    degradation: 0.2,
    wetPerformance: 0.8,
    optimalRainIntensity: { min: 0.1, max: 0.5 },
  },
  {
    compound: 'WET',
    pace: 2,
    degradation: 0.1,
    wetPerformance: 1,
    optimalRainIntensity: { min: 0.5, max: 1 },
  },
];

function context(
  overrides: Partial<SimulationContext> = {},
): SimulationContext {
  return {
    race: {
      id: 'r1',
      name: 'Test GP',
      round: 1,
      date: '2025-01-01',
      circuitId: 'c1',
      laps: 4,
      temperature: 25,
      rainProbability: 0,
    },
    circuit: {
      id: 'c1',
      name: 'Circuit',
      country: 'X',
      type: 'permanent',
      laps: 4,
      lengthKm: 5,
      baseLapTime: 100,
      pitStopLoss: 20,
      tyreWear: 1,
      overtakingDifficulty: 0.5,
    },
    parameters: {
      raceId: 'r1',
      lapTimeVariance: 0,
      pitStopLoss: 20,
      tyreChangeTime: 2,
      fuelEffectPerLap: 0.1,
      safetyCarProbability: 0,
      minimumPitStops: 1,
    },
    weather: {
      raceId: 'r1',
      summary: 'dry',
      forecast: [{ fromLap: 1, toLap: 4, temperature: 25, rainIntensity: 0 }],
    },
    tyres,
    driver: {
      id: 'd1',
      name: 'Driver',
      number: 1,
      teamId: 't1',
      pace: 1,
      consistency: 1,
    },
    team: { id: 't1', name: 'Team', carPerformance: 1 },
    ...overrides,
  };
}

const strategy: Strategy = {
  raceId: 'r1',
  driverId: 'd1',
  stints: [
    { compound: 'SOFT', laps: 2 },
    { compound: 'HARD', laps: 2 },
  ],
};

describe('simulateRace', () => {
  it('computes exact lap times with fuel burn and tyre age', () => {
    const { laps } = simulateRace(strategy, context());
    expect(laps.map((l) => l.time)).toHaveLength(4);
    expect(laps[0]!.time).toBeCloseTo(99, 10);
    expect(laps[1]!.time).toBeCloseTo(99.4 + 22, 10);
    expect(laps[2]!.time).toBeCloseTo(99.8, 10);
    expect(laps[3]!.time).toBeCloseTo(99.8, 10);
  });

  it('resets tyre age after the stop (1-based)', () => {
    const { laps } = simulateRace(strategy, context());
    expect(laps.map((l) => l.tyreAge)).toEqual([1, 2, 1, 2]);
    expect(laps.map((l) => l.stintIndex)).toEqual([0, 0, 1, 1]);
    expect(laps.map((l) => l.compound)).toEqual([
      'SOFT',
      'SOFT',
      'HARD',
      'HARD',
    ]);
  });

  it('adds a pit stop on the last lap of every stint but the final one', () => {
    const { pitStops, laps } = simulateRace(strategy, context());
    expect(pitStops).toEqual([
      {
        lap: 2,
        fromCompound: 'SOFT',
        toCompound: 'HARD',
        pitLaneLoss: 20,
        tyreChangeTime: 2,
        totalLoss: 22,
      },
    ]);
    expect(laps.map((l) => l.pitLoss)).toEqual([0, 22, 0, 0]);
  });

  it('breaks the race down by stint without pit loss', () => {
    const { stints } = simulateRace(strategy, context());
    expect(stints).toHaveLength(2);
    expect(stints[0]).toMatchObject({
      index: 0,
      compound: 'SOFT',
      startLap: 1,
      endLap: 2,
      laps: 2,
    });
    expect(stints[0]!.time).toBeCloseTo(198.4, 10);
    expect(stints[0]!.averageLapTime).toBeCloseTo(99.2, 10);
    expect(stints[1]).toMatchObject({
      index: 1,
      compound: 'HARD',
      startLap: 3,
      endLap: 4,
      laps: 2,
    });
    expect(stints[1]!.time).toBeCloseTo(199.6, 10);
    expect(stints[1]!.averageLapTime).toBeCloseTo(99.8, 10);
  });

  it('totals the lap times', () => {
    const result = simulateRace(strategy, context());
    expect(result.totalTime).toBeCloseTo(420, 10);
    const lapSum = result.laps.reduce((acc, l) => acc + l.time, 0);
    expect(result.totalTime).toBeCloseTo(lapSum, 10);
    expect(result.raceId).toBe('r1');
    expect(result.driverId).toBe('d1');
  });

  it('adds the driver delta to every lap', () => {
    const base = simulateRace(strategy, context());
    const slower = simulateRace(
      strategy,
      context({
        driver: {
          id: 'd1',
          name: 'Driver',
          number: 1,
          teamId: 't1',
          pace: 0.9,
          consistency: 1,
        },
        team: { id: 't1', name: 'Team', carPerformance: 0.8 },
      }),
    );
    expect(slower.driverDelta).toBeCloseTo(3, 10);
    slower.laps.forEach((lap, i) => {
      expect(lap.time - base.laps[i]!.time).toBeCloseTo(3, 10);
    });
    expect(slower.totalTime - base.totalTime).toBeCloseTo(12, 10);
  });

  it('applies rain penalty only on rainy laps and sums it per stint', () => {
    const rainy = context({
      weather: {
        raceId: 'r1',
        summary: 'shower',
        forecast: [
          { fromLap: 1, toLap: 1, temperature: 25, rainIntensity: 0 },
          { fromLap: 2, toLap: 3, temperature: 25, rainIntensity: 0.6 },
          { fromLap: 4, toLap: 4, temperature: 25, rainIntensity: 0 },
        ],
      },
    });
    const { laps, stints } = simulateRace(strategy, rainy);
    expect(laps.map((l) => l.rainPenalty)).toEqual([0, 10, 10, 0]);
    expect(laps[1]!.rainIntensity).toBe(0.6);
    expect(stints[0]!.rainLoss).toBeCloseTo(10, 10);
    expect(stints[1]!.rainLoss).toBeCloseTo(10, 10);
    expect(laps[1]!.time).toBeCloseTo(99.4 + 10 + 22, 10);
  });

  it('throws InvalidStrategyError for an invalid strategy', () => {
    const bad: Strategy = {
      raceId: 'r1',
      driverId: 'd1',
      stints: [{ compound: 'SOFT', laps: 4 }],
    };
    expect(() => simulateRace(bad, context())).toThrow(InvalidStrategyError);
  });

  it('throws a plain error when tyre data is missing', () => {
    const ctx = context({ tyres: tyres.filter((t) => t.compound !== 'HARD') });
    expect(() => simulateRace(strategy, ctx)).toThrow(/HARD/);
  });

  it('is deterministic', () => {
    expect(simulateRace(strategy, context())).toEqual(
      simulateRace(strategy, context()),
    );
  });
});
