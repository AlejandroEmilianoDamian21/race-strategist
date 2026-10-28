import type { Stint } from '@/shared/api/types'

function validLaps(stint: Stint): number {
  return Number.isFinite(stint.laps) && stint.laps > 0 ? stint.laps : 0
}

export function stintEnds(stints: Stint[]): number[] {
  let total = 0
  return stints.map((stint) => {
    total += validLaps(stint)
    return total
  })
}

export function movePit(stints: Stint[], index: number, lap: number): Stint[] {
  const current = stints[index]
  const next = stints[index + 1]
  if (current === undefined || next === undefined) return stints
  const start = index > 0 ? (stintEnds(stints)[index - 1] ?? 0) : 0
  const end = start + validLaps(current) + validLaps(next)
  if (end - start < 2) return stints
  const pit = Math.max(start + 1, Math.min(end - 1, Math.round(lap)))
  return stints.map((stint, position) => {
    if (position === index) return { ...stint, laps: pit - start }
    if (position === index + 1) return { ...stint, laps: end - pit }
    return stint
  })
}

export function lapAtPointer(clientX: number, barLeft: number, barWidth: number, total: number) {
  if (barWidth <= 0) return 0
  const share = Math.min(1, Math.max(0, (clientX - barLeft) / barWidth))
  return share * total
}
