import type {
  LapResult,
  SimulationResult,
  StintResult,
  TyreCompound,
  WeatherSegment,
} from '@/shared/api/types'
import { lapTicks } from '@/features/races/lap-ticks'

export const CHART = { W: 1000, H: 300, ml: 56, mr: 12, mt: 34, mb: 30 }

const LOW_PADDING = 0.3
const HIGH_PADDING = 0.6
const WIDE_RANGE = 12
const MEDIUM_RANGE = 6
const MIN_CAP_ROOM = 0.9
const CAP_ROOM_SHARE = 0.08

export interface ChartScale {
  lo: number
  hi: number
  cap: number
  step: number
}

function cleanTimes(result: SimulationResult): number[] {
  return result.laps.filter((lap) => lap.pitLoss === 0).map((lap) => lap.time)
}

export function chartScale(
  result: SimulationResult,
  previous: SimulationResult | null,
): ChartScale {
  const times = [...cleanTimes(result), ...(previous === null ? [] : cleanTimes(previous))]
  const lo = Math.floor(Math.min(...times) - LOW_PADDING)
  const hi = Math.ceil(Math.max(...times) + HIGH_PADDING)
  const range = hi - lo
  const step = range > WIDE_RANGE ? 4 : range > MEDIUM_RANGE ? 2 : 1
  return { lo, hi, cap: hi + Math.max(MIN_CAP_ROOM, range * CAP_ROOM_SHARE), step }
}

export function plotX(lap: number, totalLaps: number): number {
  if (totalLaps <= 1) return CHART.ml
  return CHART.ml + ((lap - 1) / (totalLaps - 1)) * (CHART.W - CHART.ml - CHART.mr)
}

export function plotY(time: number, scale: ChartScale): number {
  const share = (Math.min(time, scale.cap) - scale.lo) / (scale.cap - scale.lo)
  return CHART.mt + (1 - share) * (CHART.H - CHART.mt - CHART.mb)
}

export function lapAtX(x: number, totalLaps: number): number {
  if (totalLaps <= 1) return 1
  const lap = Math.round(((x - CHART.ml) / (CHART.W - CHART.ml - CHART.mr)) * (totalLaps - 1) + 1)
  return Math.max(1, Math.min(totalLaps, lap))
}

export function linePath(laps: LapResult[], totalLaps: number, scale: ChartScale): string {
  return laps
    .map(
      (lap, index) =>
        `${index === 0 ? 'M' : 'L'}${plotX(lap.lap, totalLaps).toFixed(1)} ${plotY(lap.time, scale).toFixed(1)}`,
    )
    .join('')
}

function edgeStart(lap: number, totalLaps: number): number {
  return lap === 1 ? CHART.ml : (plotX(lap - 1, totalLaps) + plotX(lap, totalLaps)) / 2
}

function edgeEnd(lap: number, totalLaps: number): number {
  return lap === totalLaps
    ? CHART.W - CHART.mr
    : (plotX(lap, totalLaps) + plotX(lap + 1, totalLaps)) / 2
}

export interface StintBand {
  compound: TyreCompound
  x0: number
  x1: number
}

export function stintBands(stints: StintResult[], totalLaps: number): StintBand[] {
  return stints.map((stint) => ({
    compound: stint.compound,
    x0: edgeStart(stint.startLap, totalLaps),
    x1: edgeEnd(stint.endLap, totalLaps),
  }))
}

export interface RainBand {
  intensity: number
  x0: number
  x1: number
}

export function rainBands(forecast: WeatherSegment[], totalLaps: number): RainBand[] {
  return forecast
    .filter((segment) => segment.rainIntensity > 0)
    .map((segment) => ({
      intensity: segment.rainIntensity,
      x0: edgeStart(segment.fromLap, totalLaps),
      x1: edgeEnd(segment.toLap, totalLaps),
    }))
}

export function yTicks(scale: ChartScale): number[] {
  const ticks: number[] = []
  for (let value = scale.lo; value <= scale.hi; value += scale.step) ticks.push(value)
  return ticks
}

export function lapXTicks(totalLaps: number): number[] {
  return totalLaps <= 1 ? [1] : lapTicks(totalLaps)
}
