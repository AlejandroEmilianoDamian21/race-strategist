import type { RaceListItem } from '../../../application/use-cases/list-races.use-case.js';

export interface RaceListItemResponse {
  id: string;
  name: string;
  round: number;
  date: string;
  laps: number;
  temperature: number;
  rainProbability: number;
  circuit: { id: string; name: string; country: string; type: string };
}

export interface RaceListResponse {
  races: RaceListItemResponse[];
}

export function toRaceListResponse(items: RaceListItem[]): RaceListResponse {
  return {
    races: items.map((item) => ({ ...item, circuit: { ...item.circuit } })),
  };
}
