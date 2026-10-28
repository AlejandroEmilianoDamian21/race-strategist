export function formatDate(isoDate: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`))
}

export function formatLapTime(seconds: number): string {
  const totalMs = Math.round(seconds * 1000)
  const minutes = Math.floor(totalMs / 60000)
  const rest = (totalMs % 60000) / 1000
  return `${minutes}:${rest.toFixed(3).padStart(6, '0')}`
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function formatSignedSeconds(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return `${sign}${Math.abs(value).toFixed(digits)}s`
}

export type RainLevel = 'dry' | 'light' | 'moderate' | 'heavy'

export function rainLevel(intensity: number): RainLevel {
  if (intensity <= 0) return 'dry'
  if (intensity <= 0.2) return 'light'
  if (intensity <= 0.5) return 'moderate'
  return 'heavy'
}
