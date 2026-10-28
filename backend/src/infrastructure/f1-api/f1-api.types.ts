export interface ApiEnvelope<T> {
  statusCode: number;
  code: string;
  message: string;
  data?: T;
}

export interface RawRace {
  id: string;
  name: string;
  round: number;
  date: string;
  circuitId: string;
  laps: number;
  temperature: number;
  rainProbability: number;
}

export interface RawCircuit {
  id: string;
  name: string;
  country: string;
  type: string;
  laps: number;
  lengthKm: number;
  baseLapTime: number;
  pitStopLoss: number;
  tyreWear: number;
  overtakingDifficulty: number;
}

export interface RawRaceDetail extends RawRace {
  circuit: RawCircuit;
}

export interface RawWeatherSegment {
  fromLap: number;
  toLap: number;
  temperature: number;
  rainIntensity: number;
}

export interface RawWeather {
  raceId: string;
  summary: string;
  forecast: RawWeatherSegment[];
}

export interface RawSimulationParameters {
  raceId: string;
  lapTimeVariance: number;
  pitStopLoss: number;
  tyreChangeTime: number;
  fuelEffectPerLap: number;
  safetyCarProbability: number;
  minimumPitStops: number;
}

export interface RawTyre {
  compound: string;
  pace: number;
  degradation: number;
  wetPerformance: number;
  optimalRainIntensity: { min: number; max: number };
}

export interface RawDriver {
  id: string;
  name: string;
  number: number;
  teamId: string;
  pace: number;
  consistency: number;
}

export interface RawTeam {
  id: string;
  name: string;
  carPerformance: number;
}

export interface RacesData {
  races: RawRace[];
}

export interface CircuitsData {
  circuits: RawCircuit[];
}

export interface TyresData {
  tyres: RawTyre[];
}

export interface DriversData {
  drivers: RawDriver[];
}

export interface TeamsData {
  teams: RawTeam[];
}
