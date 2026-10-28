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

interface Scope {
  raceId: string | null
  driverId: string | null
}

interface History extends Scope {
  current: SimulationResult
  previous: SimulationResult | null
}

function sameScope(left: Scope, right: Scope): boolean {
  return left.raceId === right.raceId && left.driverId === right.driverId
}

export function useSimulation(raceId: string | null, driverId: string | null = null) {
  const scope: Scope = { raceId, driverId }
  const [history, setHistory] = useState<History | null>(null)
  const [trackedScope, setTrackedScope] = useState(scope)
  const scopeRef = useRef(scope)
  const busyRef = useRef(false)
  useEffect(() => {
    scopeRef.current = { raceId, driverId }
  }, [raceId, driverId])

  if (!sameScope(trackedScope, scope)) {
    setTrackedScope(scope)
    setHistory(null)
  }

  const mutation = useMutation({
    mutationFn: (request: SimulateRequest) => simulate(request),
    onSuccess: (data, request) => {
      const current = scopeRef.current
      if (data.raceId !== current.raceId || request.driverId !== current.driverId) return
      setHistory((earlier) => ({
        raceId: data.raceId,
        driverId: request.driverId,
        current: data,
        previous:
          earlier !== null &&
          sameScope(earlier, { raceId: data.raceId, driverId: request.driverId })
            ? earlier.current
            : null,
      }))
    },
  })
  const { mutate, reset, variables } = mutation

  useEffect(() => {
    busyRef.current = false
    reset()
  }, [raceId, driverId, reset])

  const submit = useCallback(
    (request: SimulateRequest) => {
      if (busyRef.current) return
      busyRef.current = true
      mutate(request, {
        onSettled: () => {
          busyRef.current = false
        },
      })
    },
    [mutate],
  )
  const retry = useCallback(() => {
    if (variables !== undefined) submit(variables)
  }, [submit, variables])

  const ownRequest =
    variables !== undefined && variables.raceId === raceId && variables.driverId === driverId
      ? variables
      : null
  let view: SimulationView = { kind: 'idle' }
  if (ownRequest !== null && mutation.isPending) {
    view = { kind: 'loading', request: ownRequest }
  } else if (ownRequest !== null && mutation.isError) {
    const error = isAppError(mutation.error) ? mutation.error : new AppError('unknown')
    view = { kind: 'error', error, request: ownRequest }
  } else if (history !== null && sameScope(history, scope)) {
    view = { kind: 'success', current: history.current, previous: history.previous }
  }

  return { view, run: submit, retry }
}
