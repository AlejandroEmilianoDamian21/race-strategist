import { useEffect, useState } from 'react'

export type WakeState = 'idle' | 'waking' | 'timed-out'

export const WAKE_AFTER_SECONDS = 3
export const TIMEOUT_AFTER_SECONDS = 90

export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function classify(elapsedSeconds: number): WakeState {
  if (elapsedSeconds >= TIMEOUT_AFTER_SECONDS) return 'timed-out'
  if (elapsedSeconds >= WAKE_AFTER_SECONDS) return 'waking'
  return 'idle'
}

export function useWakeState(isPending: boolean): {
  state: WakeState
  elapsedSeconds: number
} {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [wasPending, setWasPending] = useState(isPending)

  if (wasPending !== isPending) {
    setWasPending(isPending)
    setElapsedSeconds(0)
  }

  useEffect(() => {
    if (!isPending) return
    const startedAt = Date.now()
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isPending])

  if (!isPending) return { state: 'idle', elapsedSeconds: 0 }
  return { state: classify(elapsedSeconds), elapsedSeconds }
}
