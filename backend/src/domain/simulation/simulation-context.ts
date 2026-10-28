import type { Circuit } from '../model/circuit.js';
import type { Driver } from '../model/driver.js';
import type { Race } from '../model/race.js';
import type { SimulationParameters } from '../model/simulation-parameters.js';
import type { Team } from '../model/team.js';
import type { Tyre } from '../model/tyre.js';
import type { WeatherForecast } from '../model/weather.js';

export interface SimulationContext {
  race: Race;
  circuit: Circuit;
  parameters: SimulationParameters;
  weather: WeatherForecast;
  tyres: Tyre[];
  driver: Driver;
  team: Team;
}
