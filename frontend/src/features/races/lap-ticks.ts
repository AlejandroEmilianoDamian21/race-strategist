const STEP = 10
const CROWDING_LAPS = 4
const MAX_STEPS = 12

export function lapTicks(total: number): number[] {
  if (!Number.isFinite(total)) return [1]
  const step = STEP * Math.max(1, Math.ceil(total / (STEP * MAX_STEPS)))
  const ticks = [1]
  for (let lap = step; lap < total - CROWDING_LAPS; lap += step) ticks.push(lap)
  ticks.push(total)
  return ticks
}
