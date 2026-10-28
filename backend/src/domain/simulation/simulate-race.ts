import type {
  LapResult,
  PitStop,
  SimulationResult,
  StintResult,
} from '../model/simulation-result.js';
import type { Strategy } from '../model/strategy.js';
import type { Tyre, TyreCompound } from '../model/tyre.js';
import { assertValidStrategy } from '../strategy/validate-strategy.js';
import { driverDelta, rainIntensityAt, rainPenalty } from './lap-time.js';
import type { SimulationContext } from './simulation-context.js';

function findTyre(tyres: Tyre[], compound: TyreCompound): Tyre {
  const tyre = tyres.find((t) => t.compound === compound);
  if (!tyre) {
    throw new Error(`Missing tyre data for compound ${compound}.`);
  }
  return tyre;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function simulateRace(
  strategy: Strategy,
  ctx: SimulationContext,
): SimulationResult {
  assertValidStrategy(strategy.stints, {
    raceLaps: ctx.race.laps,
    minimumPitStops: ctx.parameters.minimumPitStops,
  });

  const delta = driverDelta(ctx.driver, ctx.team);
  const compounds = strategy.stints.map((s) => s.compound as TyreCompound);
  const lastStint = strategy.stints.length - 1;

  const laps: LapResult[] = [];
  const stints: StintResult[] = [];
  const pitStops: PitStop[] = [];

  strategy.stints.forEach((stint, stintIndex) => {
    const compound = compounds[stintIndex]!;
    const tyre = findTyre(ctx.tyres, compound);
    const startLap = laps.length + 1;
    const stintLaps: LapResult[] = [];

    for (let age = 0; age < stint.laps; age++) {
      const lap = startLap + age;
      const isPitLap = age === stint.laps - 1 && stintIndex < lastStint;
      const rainIntensity = rainIntensityAt(ctx.weather.forecast, lap);
      const rain = rainPenalty(tyre, rainIntensity);

      const { pitStopLoss, tyreChangeTime } = ctx.parameters;
      const pitLoss = isPitLap ? pitStopLoss + tyreChangeTime : 0;
      if (isPitLap) {
        pitStops.push({
          lap,
          fromCompound: compound,
          toCompound: compounds[stintIndex + 1]!,
          pitLaneLoss: pitStopLoss,
          tyreChangeTime,
          totalLoss: pitLoss,
        });
      }

      const time =
        ctx.circuit.baseLapTime +
        tyre.pace +
        tyre.degradation * ctx.circuit.tyreWear * age -
        ctx.parameters.fuelEffectPerLap * (lap - 1) +
        delta +
        rain +
        pitLoss;

      stintLaps.push({
        lap,
        stintIndex,
        compound,
        tyreAge: age + 1,
        rainIntensity,
        rainPenalty: rain,
        pitLoss,
        time,
      });
    }

    const time = sum(stintLaps.map((l) => l.time - l.pitLoss));
    stints.push({
      index: stintIndex,
      compound,
      startLap,
      endLap: startLap + stint.laps - 1,
      laps: stint.laps,
      time,
      averageLapTime: time / stint.laps,
      rainLoss: sum(stintLaps.map((l) => l.rainPenalty)),
    });
    laps.push(...stintLaps);
  });

  return {
    raceId: strategy.raceId,
    driverId: strategy.driverId,
    totalTime: sum(laps.map((l) => l.time)),
    driverDelta: delta,
    stints,
    pitStops,
    laps,
  };
}
