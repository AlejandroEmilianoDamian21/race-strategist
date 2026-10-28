import type { SimulationResult } from '../../../domain/model/simulation-result.js';

export type SimulationResponse = SimulationResult;

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function toSimulationResponse(
  result: SimulationResult,
): SimulationResponse {
  return {
    raceId: result.raceId,
    driverId: result.driverId,
    totalTime: round(result.totalTime),
    driverDelta: round(result.driverDelta),
    stints: result.stints.map((stint) => ({
      ...stint,
      time: round(stint.time),
      averageLapTime: round(stint.averageLapTime),
      rainLoss: round(stint.rainLoss),
    })),
    pitStops: result.pitStops.map((stop) => ({
      ...stop,
      pitLaneLoss: round(stop.pitLaneLoss),
      tyreChangeTime: round(stop.tyreChangeTime),
      totalLoss: round(stop.totalLoss),
    })),
    laps: result.laps.map((lap) => ({
      ...lap,
      rainIntensity: round(lap.rainIntensity),
      rainPenalty: round(lap.rainPenalty),
      pitLoss: round(lap.pitLoss),
      time: round(lap.time),
    })),
  };
}
