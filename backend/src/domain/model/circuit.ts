export interface Circuit {
  id: string;
  name: string;
  country: string;
  type: string;
  laps: number;
  lengthKm: number;
  baseLapTime: number;
  pitStopLoss: number;
  tyreWear: number;
  overtakingDifficulty: number;
}
