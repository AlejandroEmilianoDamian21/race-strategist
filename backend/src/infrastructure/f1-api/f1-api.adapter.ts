import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { DataSourceUnavailableError } from '../../application/errors/data-source-unavailable.error.js';
import { F1DataPort } from '../../application/ports/f1-data.port.js';
import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';
import type { Circuit } from '../../domain/model/circuit.js';
import type { Driver } from '../../domain/model/driver.js';
import type { Race } from '../../domain/model/race.js';
import type { SimulationParameters } from '../../domain/model/simulation-parameters.js';
import type { Team } from '../../domain/model/team.js';
import { TYRE_COMPOUNDS, type Tyre } from '../../domain/model/tyre.js';
import type { WeatherForecast } from '../../domain/model/weather.js';
import { F1ApiClient } from './f1-api.client.js';
import { F1ApiHttpError } from './f1-api.http-error.js';
import {
  toCircuit,
  toDriver,
  toRace,
  toSimulationParameters,
  toTeam,
  toTyre,
  toWeather,
} from './f1-api.mapper.js';
import { F1_API_OPTIONS, type F1ApiOptions } from './f1-api.options.js';
import { TtlCache } from './ttl-cache.js';

@Injectable()
export class F1ApiAdapter extends F1DataPort implements OnModuleInit {
  private readonly logger = new Logger(F1ApiAdapter.name);
  private readonly cache: TtlCache;

  constructor(
    @Inject(F1ApiClient) private readonly client: F1ApiClient,
    @Inject(F1_API_OPTIONS) options: F1ApiOptions,
  ) {
    super();
    this.cache = new TtlCache(options.cacheTtlMs);
  }

  onModuleInit(): void {
    void this.client
      .ping()
      .then(() => this.logger.log('F1 API warm-up succeeded'))
      .catch((error: unknown) =>
        this.logger.warn(
          `F1 API warm-up failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
  }

  listRaces(): Promise<Race[]> {
    return this.loadList('/api/races', 'races', toRace);
  }

  listCircuits(): Promise<Circuit[]> {
    return this.loadList('/api/circuits', 'circuits', toCircuit);
  }

  async listTyres(): Promise<Tyre[]> {
    const path = '/api/tyres';
    const tyres = await this.loadList(path, 'tyres', toTyre);
    const present = new Set(tyres.map((tyre) => tyre.compound));
    const missing = TYRE_COMPOUNDS.filter((compound) => !present.has(compound));
    if (missing.length > 0) {
      throw new DataSourceUnavailableError(
        'invalid-response',
        path,
        `Tyre compounds missing from ${path}: ${missing.join(', ')}.`,
      );
    }
    return tyres;
  }

  listDrivers(): Promise<Driver[]> {
    return this.loadList('/api/drivers', 'drivers', toDriver);
  }

  listTeams(): Promise<Team[]> {
    return this.loadList('/api/teams', 'teams', toTeam);
  }

  async getRaceDetail(
    raceId: string,
  ): Promise<{ race: Race; circuit: Circuit }> {
    const path = `/api/races/${encodeURIComponent(raceId)}`;
    const raw = await this.loadRaceScoped<{ circuit?: unknown }>(path, raceId);
    return { race: toRace(raw, path), circuit: toCircuit(raw.circuit, path) };
  }

  async getWeather(raceId: string): Promise<WeatherForecast> {
    const path = `/api/races/${encodeURIComponent(raceId)}/weather`;
    return toWeather(await this.loadRaceScoped(path, raceId), path);
  }

  async getSimulationParameters(raceId: string): Promise<SimulationParameters> {
    const path = `/api/races/${encodeURIComponent(raceId)}/simulation-parameters`;
    return toSimulationParameters(
      await this.loadRaceScoped(path, raceId),
      path,
    );
  }

  private loadList<T>(
    path: string,
    key: string,
    map: (raw: unknown, resource: string) => T,
  ): Promise<T[]> {
    return this.cache.getOrLoad(path, async () => {
      const data = await this.client.getData<Record<string, unknown>>(path);
      const items = data[key];
      if (!Array.isArray(items)) {
        throw new DataSourceUnavailableError('invalid-response', path);
      }
      if (items.length === 0) {
        throw new DataSourceUnavailableError('empty-response', path);
      }
      return items.map((item: unknown) => map(item, path));
    });
  }

  private loadRaceScoped<T>(path: string, raceId: string): Promise<T> {
    return this.cache.getOrLoad(path, async () => {
      try {
        return await this.client.getData<T>(path);
      } catch (error) {
        if (error instanceof F1ApiHttpError) {
          if (error.status === 404 || error.status === 400) {
            throw new RaceNotFoundError(raceId);
          }
          throw new DataSourceUnavailableError('server-error', path);
        }
        throw error;
      }
    });
  }
}
