import type { TyreCompound } from './tyre.js';

export interface LapResult {
  lap: number;
  stintIndex: number;
  compound: TyreCompound;
  tyreAge: number;
  rainIntensity: number;
  rainPenalty: number;
  pitLoss: number;
  time: number;
}

export interface StintResult {
  index: number;
  compound: TyreCompound;
  startLap: number;
  endLap: number;
  laps: number;
  time: number;
  averageLapTime: number;
  rainLoss: number;
}

export interface PitStop {
  lap: number;
  fromCompound: TyreCompound;
  toCompound: TyreCompound;
  pitLaneLoss: number;
  tyreChangeTime: number;
  totalLoss: number;
}

export interface SimulationResult {
  raceId: string;
  driverId: string;
  totalTime: number;
  driverDelta: number;
  stints: StintResult[];
  pitStops: PitStop[];
  laps: LapResult[];
}
