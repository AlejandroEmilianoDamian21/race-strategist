import type { Driver } from '../model/driver.js';
import type { Team } from '../model/team.js';
import type { Tyre } from '../model/tyre.js';
import type { WeatherSegment } from '../model/weather.js';
import { driverDelta, rainIntensityAt, rainPenalty } from './lap-time.js';

const team = (carPerformance: number): Team => ({
  id: 't',
  name: 'T',
  carPerformance,
});
const driver = (pace: number): Driver => ({
  id: 'd',
  name: 'D',
  number: 1,
  teamId: 't',
  pace,
  consistency: 1,
});

describe('driverDelta', () => {
  it('is zero for a perfect driver in a perfect car', () => {
    expect(driverDelta(driver(1), team(1))).toBe(0);
  });

  it('adds car and driver deficits scaled by 10', () => {
    expect(driverDelta(driver(0.9), team(0.8))).toBeCloseTo(3, 10);
  });
});

const tyre = (min: number, max: number, wetPerformance = 0.25): Tyre => ({
  compound: 'WET',
  pace: 0,
  degradation: 0,
  wetPerformance,
  optimalRainIntensity: { min, max },
});

describe('rainPenalty', () => {
  it('is zero inside the optimal band', () => {
    expect(rainPenalty(tyre(0.3, 0.7), 0.5)).toBe(0);
    expect(rainPenalty(tyre(0.3, 0.7), 0.3)).toBe(0);
    expect(rainPenalty(tyre(0.3, 0.7), 0.7)).toBe(0);
  });

  it('penalises rain above the band by wet performance', () => {
    expect(rainPenalty(tyre(0, 0.2), 0.7)).toBeCloseTo(
      0.5 * 20 * (1 - 0.25),
      10,
    );
  });

  it('penalises a tyre running below its band', () => {
    expect(rainPenalty(tyre(0.55, 1), 0)).toBeCloseTo(3.3, 10);
  });
});

describe('rainIntensityAt', () => {
  const forecast: WeatherSegment[] = [
    { fromLap: 1, toLap: 10, temperature: 20, rainIntensity: 0.1 },
    { fromLap: 11, toLap: 20, temperature: 18, rainIntensity: 0.6 },
  ];

  it('returns the intensity of the containing segment', () => {
    expect(rainIntensityAt(forecast, 5)).toBe(0.1);
    expect(rainIntensityAt(forecast, 15)).toBe(0.6);
  });

  it('treats fromLap and toLap as inclusive', () => {
    expect(rainIntensityAt(forecast, 1)).toBe(0.1);
    expect(rainIntensityAt(forecast, 10)).toBe(0.1);
    expect(rainIntensityAt(forecast, 11)).toBe(0.6);
    expect(rainIntensityAt(forecast, 20)).toBe(0.6);
  });

  it('falls back to the last segment when no segment matches', () => {
    expect(rainIntensityAt(forecast, 99)).toBe(0.6);
  });

  it('returns zero for an empty forecast', () => {
    expect(rainIntensityAt([], 3)).toBe(0);
  });
});
