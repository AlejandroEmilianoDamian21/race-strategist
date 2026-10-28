import type { Circuit } from '../../src/domain/model/circuit.js';
import type { Driver } from '../../src/domain/model/driver.js';
import type { Race } from '../../src/domain/model/race.js';
import type { SimulationParameters } from '../../src/domain/model/simulation-parameters.js';
import type { Team } from '../../src/domain/model/team.js';
import type { Tyre } from '../../src/domain/model/tyre.js';
import type { WeatherForecast } from '../../src/domain/model/weather.js';

export const circuits: Circuit[] = [
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    type: 'high-speed',
    laps: 53,
    lengthKm: 5.793,
    baseLapTime: 82,
    pitStopLoss: 20,
    tyreWear: 0.8,
    overtakingDifficulty: 0.4,
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    type: 'street',
    laps: 78,
    lengthKm: 3.337,
    baseLapTime: 74,
    pitStopLoss: 22,
    tyreWear: 0.6,
    overtakingDifficulty: 0.95,
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    type: 'high-speed',
    laps: 44,
    lengthKm: 7.004,
    baseLapTime: 106,
    pitStopLoss: 19,
    tyreWear: 0.9,
    overtakingDifficulty: 0.5,
  },
];

export const races: Race[] = [
  {
    id: 'spa-2026',
    name: 'Belgian Grand Prix',
    round: 14,
    date: '2026-07-26',
    circuitId: 'spa',
    laps: 44,
    temperature: 21,
    rainProbability: 0.45,
  },
  {
    id: 'monaco-2026',
    name: 'Monaco Grand Prix',
    round: 8,
    date: '2026-05-24',
    circuitId: 'monaco',
    laps: 78,
    temperature: 24,
    rainProbability: 0.1,
  },
  {
    id: 'monza-2026',
    name: 'Italian Grand Prix',
    round: 16,
    date: '2026-09-06',
    circuitId: 'monza',
    laps: 53,
    temperature: 28,
    rainProbability: 0.05,
  },
];

export const tyres: Tyre[] = [
  {
    compound: 'SOFT',
    pace: -0.8,
    degradation: 0.09,
    wetPerformance: 0.1,
    optimalRainIntensity: { min: 0, max: 0.1 },
  },
  {
    compound: 'MEDIUM',
    pace: -0.4,
    degradation: 0.05,
    wetPerformance: 0.15,
    optimalRainIntensity: { min: 0, max: 0.15 },
  },
  {
    compound: 'HARD',
    pace: 0,
    degradation: 0.025,
    wetPerformance: 0.2,
    optimalRainIntensity: { min: 0, max: 0.2 },
  },
  {
    compound: 'INTERMEDIATE',
    pace: 1.5,
    degradation: 0.04,
    wetPerformance: 0.8,
    optimalRainIntensity: { min: 0.2, max: 0.6 },
  },
  {
    compound: 'WET',
    pace: 3,
    degradation: 0.03,
    wetPerformance: 1,
    optimalRainIntensity: { min: 0.6, max: 1 },
  },
];

export const teams: Team[] = [
  { id: 'ferrari', name: 'Ferrari', carPerformance: 0.95 },
  { id: 'mclaren', name: 'McLaren', carPerformance: 0.97 },
];

export const drivers: Driver[] = [
  {
    id: 'leclerc',
    name: 'Charles Leclerc',
    number: 16,
    teamId: 'ferrari',
    pace: 0.96,
    consistency: 0.9,
  },
  {
    id: 'norris',
    name: 'Lando Norris',
    number: 4,
    teamId: 'mclaren',
    pace: 0.97,
    consistency: 0.92,
  },
];

export function weatherFor(raceId: string): WeatherForecast {
  return {
    raceId,
    summary: 'Mostly dry with a chance of light rain.',
    forecast: [
      { fromLap: 1, toLap: 30, temperature: 22, rainIntensity: 0 },
      { fromLap: 31, toLap: 44, temperature: 20, rainIntensity: 0.3 },
    ],
  };
}

export function simulationParametersFor(raceId: string): SimulationParameters {
  return {
    raceId,
    lapTimeVariance: 0.3,
    pitStopLoss: 20,
    tyreChangeTime: 2.5,
    fuelEffectPerLap: 0.03,
    safetyCarProbability: 0.2,
    minimumPitStops: 1,
  };
}
