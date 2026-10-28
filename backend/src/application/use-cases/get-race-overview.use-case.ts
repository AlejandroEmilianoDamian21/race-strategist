import { Inject, Injectable } from '@nestjs/common';
import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';
import type { Circuit } from '../../domain/model/circuit.js';
import { TYRE_COMPOUNDS, type Tyre } from '../../domain/model/tyre.js';
import type { WeatherSegment } from '../../domain/model/weather.js';
import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { F1DataPort } from '../ports/f1-data.port.js';

export interface RaceOverviewDriver {
  id: string;
  name: string;
  number: number;
  pace: number;
  consistency: number;
}

export interface RaceOverviewTeam {
  id: string;
  name: string;
  carPerformance: number;
  drivers: RaceOverviewDriver[];
}

export interface RaceOverview {
  race: {
    id: string;
    name: string;
    round: number;
    date: string;
    laps: number;
    temperature: number;
    rainProbability: number;
  };
  circuit: Circuit;
  weather: { summary: string; forecast: WeatherSegment[] };
  parameters: {
    lapTimeVariance: number;
    pitStopLoss: number;
    tyreChangeTime: number;
    fuelEffectPerLap: number;
    safetyCarProbability: number;
    minimumPitStops: number;
  };
  tyres: Tyre[];
  teams: RaceOverviewTeam[];
}

async function allPreferringRaceNotFound<T extends readonly unknown[] | []>(
  values: T,
): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  const settled = await Promise.allSettled(values);
  const failures = settled.flatMap((result) =>
    result.status === 'rejected' ? [result.reason as unknown] : [],
  );
  if (failures.length > 0) {
    throw (
      failures.find((reason) => reason instanceof RaceNotFoundError) ??
      failures[0]
    );
  }
  return settled.map(
    (result) => (result as PromiseFulfilledResult<unknown>).value,
  ) as { -readonly [P in keyof T]: Awaited<T[P]> };
}

@Injectable()
export class GetRaceOverview {
  constructor(@Inject(F1DataPort) private readonly f1Data: F1DataPort) {}

  async execute(raceId: string): Promise<RaceOverview> {
    const [detail, weather, parameters, tyres, drivers, teams] =
      await allPreferringRaceNotFound([
        this.f1Data.getRaceDetail(raceId),
        this.f1Data.getWeather(raceId),
        this.f1Data.getSimulationParameters(raceId),
        this.f1Data.listTyres(),
        this.f1Data.listDrivers(),
        this.f1Data.listTeams(),
      ]);
    const { race, circuit } = detail;

    const driversByTeam = new Map<string, RaceOverviewDriver[]>();
    for (const driver of drivers) {
      if (!teams.some((team) => team.id === driver.teamId)) {
        throw new DataSourceUnavailableError(
          'invalid-response',
          '/api/teams',
          `Driver "${driver.id}" references unknown team "${driver.teamId}".`,
        );
      }
      const members = driversByTeam.get(driver.teamId) ?? [];
      members.push({
        id: driver.id,
        name: driver.name,
        number: driver.number,
        pace: driver.pace,
        consistency: driver.consistency,
      });
      driversByTeam.set(driver.teamId, members);
    }

    return {
      race: {
        id: race.id,
        name: race.name,
        round: race.round,
        date: race.date,
        laps: race.laps,
        temperature: race.temperature,
        rainProbability: race.rainProbability,
      },
      circuit: { ...circuit },
      weather: {
        summary: weather.summary,
        forecast: weather.forecast.map((segment) => ({ ...segment })),
      },
      parameters: {
        lapTimeVariance: parameters.lapTimeVariance,
        pitStopLoss: parameters.pitStopLoss,
        tyreChangeTime: parameters.tyreChangeTime,
        fuelEffectPerLap: parameters.fuelEffectPerLap,
        safetyCarProbability: parameters.safetyCarProbability,
        minimumPitStops: parameters.minimumPitStops,
      },
      tyres: [...tyres].sort(
        (a, b) =>
          TYRE_COMPOUNDS.indexOf(a.compound) -
          TYRE_COMPOUNDS.indexOf(b.compound),
      ),
      teams: teams.flatMap((team) => {
        const members = driversByTeam.get(team.id);
        if (!members) {
          return [];
        }
        return [
          {
            id: team.id,
            name: team.name,
            carPerformance: team.carPerformance,
            drivers: [...members].sort((a, b) => a.number - b.number),
          },
        ];
      }),
    };
  }
}
