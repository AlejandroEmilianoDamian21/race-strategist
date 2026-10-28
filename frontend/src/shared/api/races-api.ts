import { request } from './http-client'
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

export function simulate(body: SimulateRequest, signal?: AbortSignal): Promise<SimulationResult> {
  return request<SimulationResult>('/api/simulate', { method: 'POST', body, signal })
}
