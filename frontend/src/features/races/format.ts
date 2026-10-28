const MONTHS: Record<'es' | 'en', string[]> = {
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
}

export function formatRaceDate(isoDate: string, language: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  const names = language.toLowerCase().startsWith('es') ? MONTHS.es : MONTHS.en
  return `${day} ${names[Number(month) - 1]} ${year}`
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
