import { Inject, Injectable } from '@nestjs/common';
import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { F1DataPort } from '../ports/f1-data.port.js';

export interface RaceListItem {
  id: string;
  name: string;
  round: number;
  date: string;
  laps: number;
  temperature: number;
  rainProbability: number;
  circuit: { id: string; name: string; country: string; type: string };
}

@Injectable()
export class ListRaces {
  constructor(@Inject(F1DataPort) private readonly f1Data: F1DataPort) {}

  async execute(): Promise<RaceListItem[]> {
    const [races, circuits] = await Promise.all([
      this.f1Data.listRaces(),
      this.f1Data.listCircuits(),
    ]);
    const circuitsById = new Map(circuits.map((c) => [c.id, c]));

    return races
      .map((race): RaceListItem => {
        const circuit = circuitsById.get(race.circuitId);
        if (!circuit) {
          throw new DataSourceUnavailableError(
            'invalid-response',
            '/api/circuits',
            `Race "${race.id}" references unknown circuit "${race.circuitId}".`,
          );
        }
        return {
          id: race.id,
          name: race.name,
          round: race.round,
          date: race.date,
          laps: race.laps,
          temperature: race.temperature,
          rainProbability: race.rainProbability,
          circuit: {
            id: circuit.id,
            name: circuit.name,
            country: circuit.country,
            type: circuit.type,
          },
        };
      })
      .sort((a, b) => a.round - b.round);
  }
}
