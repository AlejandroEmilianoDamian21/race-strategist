import type { RaceOverview } from '../../../application/use-cases/get-race-overview.use-case.js';

export type RaceOverviewResponse = RaceOverview;

export function toRaceOverviewResponse(
  overview: RaceOverview,
): RaceOverviewResponse {
  return {
    race: { ...overview.race },
    circuit: { ...overview.circuit },
    weather: {
      summary: overview.weather.summary,
      forecast: overview.weather.forecast.map((segment) => ({ ...segment })),
    },
    parameters: { ...overview.parameters },
    tyres: overview.tyres.map((tyre) => ({
      ...tyre,
      optimalRainIntensity: { ...tyre.optimalRainIntensity },
    })),
    teams: overview.teams.map((team) => ({
      ...team,
      drivers: team.drivers.map((driver) => ({ ...driver })),
    })),
  };
}
