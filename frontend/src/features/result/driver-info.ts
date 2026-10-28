import type { RaceOverview } from '@/shared/api/types'

export interface DriverInfo {
  name: string
  number: number
  pace: number
  teamName: string
  carPerformance: number
}

export function driverInfo(overview: RaceOverview, driverId: string): DriverInfo | null {
  for (const team of overview.teams) {
    const driver = team.drivers.find((candidate) => candidate.id === driverId)
    if (driver !== undefined) {
      return {
        name: driver.name,
        number: driver.number,
        pace: driver.pace,
        teamName: team.name,
        carPerformance: team.carPerformance,
      }
    }
  }
  return null
}
