import type { RaceListItem, RaceOverview } from '@/shared/api/types'

export const MONZA: RaceListItem = {
  id: 'italian-gp',
  name: 'Italian Grand Prix',
  round: 3,
  date: '2026-09-06',
  laps: 53,
  temperature: 28,
  rainProbability: 0.1,
  circuit: { id: 'monza', name: 'Autodromo Nazionale Monza', country: 'Italy', type: 'permanent' },
}

export const MONACO: RaceListItem = {
  id: 'monaco-gp',
  name: 'Monaco Grand Prix',
  round: 2,
  date: '2026-05-24',
  laps: 78,
  temperature: 22,
  rainProbability: 0.6,
  circuit: { id: 'monaco', name: 'Circuit de Monaco', country: 'Monaco', type: 'street' },
}

export const OVERVIEW: RaceOverview = {
  race: {
    id: 'italian-gp',
    name: 'Italian Grand Prix',
    round: 3,
    date: '2026-09-06',
    laps: 53,
    temperature: 28,
    rainProbability: 0.1,
  },
  circuit: {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy',
    type: 'permanent',
    laps: 53,
    lengthKm: 5.793,
    baseLapTime: 81.5,
    pitStopLoss: 19.5,
    tyreWear: 0.9,
    overtakingDifficulty: 0.4,
  },
  weather: {
    summary: 'Dry start, light rain in the closing laps.',
    forecast: [
      { fromLap: 1, toLap: 30, temperature: 28, rainIntensity: 0 },
      { fromLap: 31, toLap: 53, temperature: 24, rainIntensity: 0.35 },
    ],
  },
  parameters: {
    lapTimeVariance: 0.3,
    pitStopLoss: 19.5,
    tyreChangeTime: 2.5,
    fuelEffectPerLap: 0.03,
    safetyCarProbability: 0.25,
    minimumPitStops: 1,
  },
  tyres: [
    {
      compound: 'SOFT',
      pace: -1,
      degradation: 0.1,
      wetPerformance: 0.1,
      optimalRainIntensity: { min: 0, max: 0.05 },
    },
    {
      compound: 'HARD',
      pace: 0.5,
      degradation: 0.04,
      wetPerformance: 0.2,
      optimalRainIntensity: { min: 0, max: 0.1 },
    },
    {
      compound: 'WET',
      pace: 4,
      degradation: 0.05,
      wetPerformance: 0.9,
      optimalRainIntensity: { min: 0.6, max: 1 },
    },
  ],
  teams: [
    {
      id: 'ferrari',
      name: 'Ferrari',
      carPerformance: 0.95,
      drivers: [
        { id: 'leclerc', name: 'Charles Leclerc', number: 16, pace: 0.97, consistency: 0.9 },
        { id: 'hamilton', name: 'Lewis Hamilton', number: 44, pace: 0.96, consistency: 0.92 },
      ],
    },
    {
      id: 'newteam',
      name: 'Unlisted Team',
      carPerformance: 0.8,
      drivers: [{ id: 'rookie', name: 'Rookie Driver', number: 99, pace: 0.8, consistency: 0.7 }],
    },
  ],
}
