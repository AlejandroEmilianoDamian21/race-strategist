const STEP = 10
const CROWDING_LAPS = 4

export function lapTicks(total: number): number[] {
  const ticks = [1]
  for (let lap = STEP; lap < total - CROWDING_LAPS; lap += STEP) ticks.push(lap)
  ticks.push(total)
  return ticks
}
