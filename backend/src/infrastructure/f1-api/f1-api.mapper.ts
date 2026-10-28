import { DataSourceUnavailableError } from '../../application/errors/data-source-unavailable.error.js';
import type { Circuit } from '../../domain/model/circuit.js';
import type { Driver } from '../../domain/model/driver.js';
import type { Race } from '../../domain/model/race.js';
import type { SimulationParameters } from '../../domain/model/simulation-parameters.js';
import type { Team } from '../../domain/model/team.js';
import { isTyreCompound, type Tyre } from '../../domain/model/tyre.js';
import type { WeatherForecast } from '../../domain/model/weather.js';

type Fields = Record<string, unknown>;

const invalid = (resource: string, detail: string): never => {
  throw new DataSourceUnavailableError(
    'invalid-response',
    resource,
    `Invalid data from ${resource}: ${detail}.`,
  );
};

const asObject = (value: unknown, resource: string, name: string): Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Fields)
    : invalid(resource, `${name} is not an object`);

const text = (source: Fields, key: string, resource: string): string => {
  const value = source[key];
  return typeof value === 'string' && value.length > 0
    ? value
    : invalid(resource, `"${key}" must be a non-empty string`);
};

const num = (source: Fields, key: string, resource: string): number => {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : invalid(resource, `"${key}" must be a finite number`);
};

export const toRace = (raw: unknown, resource: string): Race => {
  const source = asObject(raw, resource, 'race');
  return {
    id: text(source, 'id', resource),
    name: text(source, 'name', resource),
    round: num(source, 'round', resource),
    date: text(source, 'date', resource),
    circuitId: text(source, 'circuitId', resource),
    laps: num(source, 'laps', resource),
    temperature: num(source, 'temperature', resource),
    rainProbability: num(source, 'rainProbability', resource),
  };
};

export const toCircuit = (raw: unknown, resource: string): Circuit => {
  const source = asObject(raw, resource, 'circuit');
  return {
    id: text(source, 'id', resource),
    name: text(source, 'name', resource),
    country: text(source, 'country', resource),
    type: text(source, 'type', resource),
    laps: num(source, 'laps', resource),
    lengthKm: num(source, 'lengthKm', resource),
    baseLapTime: num(source, 'baseLapTime', resource),
    pitStopLoss: num(source, 'pitStopLoss', resource),
    tyreWear: num(source, 'tyreWear', resource),
    overtakingDifficulty: num(source, 'overtakingDifficulty', resource),
  };
};

export const toWeather = (raw: unknown, resource: string): WeatherForecast => {
  const source = asObject(raw, resource, 'weather');
  const forecast = source.forecast;
  if (!Array.isArray(forecast)) {
    return invalid(resource, '"forecast" must be an array');
  }
  return {
    raceId: text(source, 'raceId', resource),
    summary: text(source, 'summary', resource),
    forecast: forecast.map((segment: unknown) => {
      const item = asObject(segment, resource, 'forecast segment');
      return {
        fromLap: num(item, 'fromLap', resource),
        toLap: num(item, 'toLap', resource),
        temperature: num(item, 'temperature', resource),
        rainIntensity: num(item, 'rainIntensity', resource),
      };
    }),
  };
};

export const toSimulationParameters = (
  raw: unknown,
  resource: string,
): SimulationParameters => {
  const source = asObject(raw, resource, 'simulation parameters');
  return {
    raceId: text(source, 'raceId', resource),
    lapTimeVariance: num(source, 'lapTimeVariance', resource),
    pitStopLoss: num(source, 'pitStopLoss', resource),
    tyreChangeTime: num(source, 'tyreChangeTime', resource),
    fuelEffectPerLap: num(source, 'fuelEffectPerLap', resource),
    safetyCarProbability: num(source, 'safetyCarProbability', resource),
    minimumPitStops: num(source, 'minimumPitStops', resource),
  };
};

export const toTyre = (raw: unknown, resource: string): Tyre => {
  const source = asObject(raw, resource, 'tyre');
  const compound = source.compound;
  if (!isTyreCompound(compound)) {
    return invalid(resource, `unknown compound "${String(compound)}"`);
  }
  const band = asObject(
    source.optimalRainIntensity,
    resource,
    'optimalRainIntensity',
  );
  return {
    compound,
    pace: num(source, 'pace', resource),
    degradation: num(source, 'degradation', resource),
    wetPerformance: num(source, 'wetPerformance', resource),
    optimalRainIntensity: {
      min: num(band, 'min', resource),
      max: num(band, 'max', resource),
    },
  };
};

export const toDriver = (raw: unknown, resource: string): Driver => {
  const source = asObject(raw, resource, 'driver');
  return {
    id: text(source, 'id', resource),
    name: text(source, 'name', resource),
    number: num(source, 'number', resource),
    teamId: text(source, 'teamId', resource),
    pace: num(source, 'pace', resource),
    consistency: num(source, 'consistency', resource),
  };
};

export const toTeam = (raw: unknown, resource: string): Team => {
  const source = asObject(raw, resource, 'team');
  return {
    id: text(source, 'id', resource),
    name: text(source, 'name', resource),
    carPerformance: num(source, 'carPerformance', resource),
  };
};
