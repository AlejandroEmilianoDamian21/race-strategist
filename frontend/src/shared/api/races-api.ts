import { AppError } from './app-error'
import { request } from './http-client'
import { isSimulationResult } from './simulation-guard'
import type {
  RaceListItem,
  RaceListResponse,
  RaceOverview,
  SimulateRequest,
  SimulationResult,
} from './types'

export async function getRaces(signal?: AbortSignal): Promise<RaceListItem[]> {
  const response = await request<RaceListResponse>('/api/races', { signal })
  return response.races
}

export function getRaceOverview(id: string, signal?: AbortSignal): Promise<RaceOverview> {
  return request<RaceOverview>(`/api/races/${encodeURIComponent(id)}/overview`, { signal })
}

export async function simulate(
  body: SimulateRequest,
  signal?: AbortSignal,
): Promise<SimulationResult> {
  const payload = await request<unknown>('/api/simulate', { method: 'POST', body, signal })
  if (!isSimulationResult(payload)) {
    throw new AppError('unknown', { method: 'POST', path: '/api/simulate', status: 200 })
  }
  return payload
}
