import type { Driver } from '../model/driver.js';
import type { Team } from '../model/team.js';
import type { Tyre } from '../model/tyre.js';
import type { WeatherSegment } from '../model/weather.js';

export function driverDelta(driver: Driver, team: Team): number {
  return (1 - team.carPerformance + (1 - driver.pace)) * 10;
}

export function rainPenalty(tyre: Tyre, rainIntensity: number): number {
  const { min, max } = tyre.optimalRainIntensity;
  if (rainIntensity > max) {
    return (rainIntensity - max) * 20 * (1 - tyre.wetPerformance);
  }
  if (rainIntensity < min) {
    return (min - rainIntensity) * 6;
  }
  return 0;
}

export function rainIntensityAt(
  forecast: WeatherSegment[],
  lap: number,
): number {
  const segment =
    forecast.find((s) => lap >= s.fromLap && lap <= s.toLap) ??
    forecast[forecast.length - 1];
  return segment?.rainIntensity ?? 0;
}
