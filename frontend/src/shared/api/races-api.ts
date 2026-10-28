import { request } from './http-client'
import type {
  RaceListItem,
  RaceListResponse,
  RaceOverview,
  SimulateRequest,
  SimulationResult,
} from './types'

export async function getRaces(): Promise<RaceListItem[]> {
  const response = await request<RaceListResponse>('/api/races')
  return response.races
}

export function getRaceOverview(id: string): Promise<RaceOverview> {
  return request<RaceOverview>(`/api/races/${encodeURIComponent(id)}/overview`)
}

export function simulate(body: SimulateRequest): Promise<SimulationResult> {
  return request<SimulationResult>('/api/simulate', { method: 'POST', body })
}
