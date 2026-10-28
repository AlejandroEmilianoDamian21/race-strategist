export interface Stint {
  compound: string;
  laps: number;
}

export interface Strategy {
  raceId: string;
  driverId: string;
  stints: Stint[];
}
