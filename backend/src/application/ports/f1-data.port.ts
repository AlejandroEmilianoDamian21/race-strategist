import type { Circuit } from '../../domain/model/circuit.js';
import type { Driver } from '../../domain/model/driver.js';
import type { Race } from '../../domain/model/race.js';
import type { SimulationParameters } from '../../domain/model/simulation-parameters.js';
import type { Team } from '../../domain/model/team.js';
import type { Tyre } from '../../domain/model/tyre.js';
import type { WeatherForecast } from '../../domain/model/weather.js';

export abstract class F1DataPort {
  abstract listRaces(): Promise<Race[]>;
  abstract listCircuits(): Promise<Circuit[]>;
  abstract getRaceDetail(
    raceId: string,
  ): Promise<{ race: Race; circuit: Circuit }>;
  abstract getWeather(raceId: string): Promise<WeatherForecast>;
  abstract getSimulationParameters(
    raceId: string,
  ): Promise<SimulationParameters>;
  abstract listTyres(): Promise<Tyre[]>;
  abstract listDrivers(): Promise<Driver[]>;
  abstract listTeams(): Promise<Team[]>;
}
