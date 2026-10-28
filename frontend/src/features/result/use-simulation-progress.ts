import { useEffect, useState } from 'react'

const TICK_MS = 70
const STEP_SHARE = 0.06

export function useSimulationProgress(active: boolean, totalLaps: number): number | null {
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setTicks((current) => current + 1), TICK_MS)
    return () => {
      clearInterval(timer)
      setTicks(0)
    }
  }, [active])

  if (!active) return null
  const step = Math.max(1, Math.round(totalLaps * STEP_SHARE))
  return Math.min(Math.max(0, totalLaps - 1), ticks * step)
}
