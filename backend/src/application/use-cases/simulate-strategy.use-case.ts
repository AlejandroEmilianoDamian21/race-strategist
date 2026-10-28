import { Inject, Injectable } from '@nestjs/common';
import { DriverNotFoundError } from '../../domain/errors/driver-not-found.error.js';
import type { SimulationResult } from '../../domain/model/simulation-result.js';
import type { Strategy } from '../../domain/model/strategy.js';
import { simulateRace } from '../../domain/simulation/simulate-race.js';
import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { F1DataPort } from '../ports/f1-data.port.js';
import { allPreferringRaceNotFound } from './all-preferring-race-not-found.js';

@Injectable()
export class SimulateStrategy {
  constructor(@Inject(F1DataPort) private readonly f1Data: F1DataPort) {}

  async execute(strategy: Strategy): Promise<SimulationResult> {
    const { raceId } = strategy;
    const [detail, weather, parameters, tyres, drivers, teams] =
      await allPreferringRaceNotFound([
        this.f1Data.getRaceDetail(raceId),
        this.f1Data.getWeather(raceId),
        this.f1Data.getSimulationParameters(raceId),
        this.f1Data.listTyres(),
        this.f1Data.listDrivers(),
        this.f1Data.listTeams(),
      ]);

    const driver = drivers.find((d) => d.id === strategy.driverId);
    if (!driver) {
      throw new DriverNotFoundError(strategy.driverId);
    }
    const team = teams.find((t) => t.id === driver.teamId);
    if (!team) {
      throw new DataSourceUnavailableError(
        'invalid-response',
        '/api/teams',
        `Driver "${driver.id}" references unknown team "${driver.teamId}".`,
      );
    }

    const result = simulateRace(strategy, {
      race: detail.race,
      circuit: detail.circuit,
      parameters,
      weather,
      tyres,
      driver,
      team,
    });
    return { ...result, raceId: detail.race.id, driverId: driver.id };
  }
}
