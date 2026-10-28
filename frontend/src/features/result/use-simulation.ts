import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppError, isAppError } from '@/shared/api/app-error'
import { simulate } from '@/shared/api/races-api'
import type { SimulateRequest, SimulationResult } from '@/shared/api/types'

export type SimulationView =
  | { kind: 'idle' }
  | { kind: 'loading'; request: SimulateRequest }
  | { kind: 'error'; error: AppError; request: SimulateRequest }
  | { kind: 'success'; current: SimulationResult; previous: SimulationResult | null }

interface History {
  raceId: string
  current: SimulationResult
  previous: SimulationResult | null
}

export function useSimulation(raceId: string | null) {
  const [history, setHistory] = useState<History | null>(null)
  const [scope, setScope] = useState(raceId)
  const raceRef = useRef(raceId)
  useEffect(() => {
    raceRef.current = raceId
  }, [raceId])

  if (scope !== raceId) {
    setScope(raceId)
    setHistory(null)
  }

  const mutation = useMutation({
    mutationFn: (request: SimulateRequest) => simulate(request),
    onSuccess: (data) => {
      if (data.raceId !== raceRef.current) return
      setHistory((earlier) => ({
        raceId: data.raceId,
        current: data,
        previous: earlier !== null && earlier.raceId === data.raceId ? earlier.current : null,
      }))
    },
  })
  const { mutate, reset, variables } = mutation

  useEffect(() => {
    reset()
  }, [raceId, reset])

  const run = useCallback((request: SimulateRequest) => mutate(request), [mutate])
  const retry = useCallback(() => {
    if (variables !== undefined) mutate(variables)
  }, [mutate, variables])

  const ownRequest = variables !== undefined && variables.raceId === raceId ? variables : null
  let view: SimulationView = { kind: 'idle' }
  if (ownRequest !== null && mutation.isPending) {
    view = { kind: 'loading', request: ownRequest }
  } else if (ownRequest !== null && mutation.isError) {
    const error = isAppError(mutation.error) ? mutation.error : new AppError('unknown')
    view = { kind: 'error', error, request: ownRequest }
  } else if (history !== null && history.raceId === raceId) {
    view = { kind: 'success', current: history.current, previous: history.previous }
  }

  return { view, run, retry }
}
