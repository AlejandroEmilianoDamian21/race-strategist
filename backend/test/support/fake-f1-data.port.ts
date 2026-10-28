import { F1DataPort } from '../../src/application/ports/f1-data.port.js';
import { RaceNotFoundError } from '../../src/domain/errors/race-not-found.error.js';
import type { Circuit } from '../../src/domain/model/circuit.js';
import type { Driver } from '../../src/domain/model/driver.js';
import type { Race } from '../../src/domain/model/race.js';
import type { SimulationParameters } from '../../src/domain/model/simulation-parameters.js';
import type { Team } from '../../src/domain/model/team.js';
import type { Tyre } from '../../src/domain/model/tyre.js';
import type { WeatherForecast } from '../../src/domain/model/weather.js';
import {
  circuits,
  drivers,
  races,
  simulationParametersFor,
  teams,
  tyres,
  weatherFor,
} from './f1-fixtures.js';

type PortMethod = Exclude<keyof F1DataPort, never>;

export class FakeF1DataPort extends F1DataPort {
  races: Race[] = [...races];
  circuits: Circuit[] = [...circuits];
  tyres: Tyre[] = [...tyres];
  teams: Team[] = [...teams];
  drivers: Driver[] = [...drivers];

  readonly calls: PortMethod[] = [];
  private readonly failures = new Map<PortMethod, Error>();

  failWith(method: PortMethod, error: Error): this {
    this.failures.set(method, error);
    return this;
  }

  listRaces(): Promise<Race[]> {
    return this.respond('listRaces', () => this.races);
  }

  listCircuits(): Promise<Circuit[]> {
    return this.respond('listCircuits', () => this.circuits);
  }

  getRaceDetail(raceId: string): Promise<{ race: Race; circuit: Circuit }> {
    return this.respond('getRaceDetail', () => {
      const race = this.requireRace(raceId);
      const circuit = this.circuits.find((c) => c.id === race.circuitId);
      if (!circuit) {
        throw new RaceNotFoundError(raceId);
      }
      return { race, circuit };
    });
  }

  getWeather(raceId: string): Promise<WeatherForecast> {
    return this.respond('getWeather', () => {
      this.requireRace(raceId);
      return weatherFor(raceId);
    });
  }

  getSimulationParameters(raceId: string): Promise<SimulationParameters> {
    return this.respond('getSimulationParameters', () => {
      this.requireRace(raceId);
      return simulationParametersFor(raceId);
    });
  }

  listTyres(): Promise<Tyre[]> {
    return this.respond('listTyres', () => this.tyres);
  }

  listDrivers(): Promise<Driver[]> {
    return this.respond('listDrivers', () => this.drivers);
  }

  listTeams(): Promise<Team[]> {
    return this.respond('listTeams', () => this.teams);
  }

  private requireRace(raceId: string): Race {
    const race = this.races.find((r) => r.id === raceId);
    if (!race) {
      throw new RaceNotFoundError(raceId);
    }
    return race;
  }

  private respond<T>(method: PortMethod, produce: () => T): Promise<T> {
    this.calls.push(method);
    const failure = this.failures.get(method);
    if (failure) {
      return Promise.reject(failure);
    }
    try {
      return Promise.resolve(produce());
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
