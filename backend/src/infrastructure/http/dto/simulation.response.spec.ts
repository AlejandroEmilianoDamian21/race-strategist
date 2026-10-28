import type { SimulationResult } from '../../../domain/model/simulation-result.js';
import { toSimulationResponse } from './simulation.response.js';

const result: SimulationResult = {
  raceId: 'spa-2026',
  driverId: 'norris',
  totalTime: 4567.123456,
  driverDelta: 0.8000000000000007,
  stints: [
    {
      index: 0,
      compound: 'SOFT',
      startLap: 1,
      endLap: 20,
      laps: 20,
      time: 2000.12345,
      averageLapTime: 100.0061725,
      rainLoss: 0.0004,
    },
  ],
  pitStops: [
    {
      lap: 20,
      fromCompound: 'SOFT',
      toCompound: 'HARD',
      pitLaneLoss: 20.00049,
      tyreChangeTime: 2.5,
      totalLoss: 22.50049,
    },
  ],
  laps: [
    {
      lap: 1,
      stintIndex: 0,
      compound: 'SOFT',
      tyreAge: 0,
      rainIntensity: 0.30000000000000004,
      rainPenalty: 1.23456789,
      pitLoss: 22.50049,
      time: 105.987654321,
    },
  ],
};

describe('toSimulationResponse', () => {
  it('rounds every time-like number to 3 decimals', () => {
    const response = toSimulationResponse(result);

    expect(response.totalTime).toBe(4567.123);
    expect(response.driverDelta).toBe(0.8);
    expect(response.stints[0]).toMatchObject({
      time: 2000.123,
      averageLapTime: 100.006,
      rainLoss: 0,
    });
    expect(response.pitStops[0]).toMatchObject({
      pitLaneLoss: 20,
      tyreChangeTime: 2.5,
      totalLoss: 22.5,
    });
    expect(response.laps[0]).toMatchObject({
      rainPenalty: 1.235,
      pitLoss: 22.5,
      time: 105.988,
    });
  });

  it('keeps identifiers, integers and compounds untouched and rounds rainIntensity', () => {
    const response = toSimulationResponse(result);

    expect(response.raceId).toBe('spa-2026');
    expect(response.driverId).toBe('norris');
    expect(response.stints[0]).toMatchObject({
      index: 0,
      compound: 'SOFT',
      startLap: 1,
      endLap: 20,
      laps: 20,
    });
    expect(response.pitStops[0]).toMatchObject({
      lap: 20,
      fromCompound: 'SOFT',
      toCompound: 'HARD',
    });
    expect(response.laps[0]).toMatchObject({
      lap: 1,
      stintIndex: 0,
      compound: 'SOFT',
      tyreAge: 0,
      rainIntensity: 0.3,
    });
  });

  it('does not mutate the domain result', () => {
    toSimulationResponse(result);

    expect(result.totalTime).toBe(4567.123456);
  });
});
