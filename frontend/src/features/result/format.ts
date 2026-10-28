const MS_PER_SECOND = 1000
const TENTHS_PER_MINUTE = 600
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

function pad(value: string, width: number): string {
  return value.padStart(width, '0')
}

export function formatTotalTime(seconds: number): string {
  const totalMs = Math.round(seconds * MS_PER_SECOND)
  const hours = Math.floor(totalMs / (SECONDS_PER_HOUR * MS_PER_SECOND))
  const rest = totalMs - hours * SECONDS_PER_HOUR * MS_PER_SECOND
  const minutes = Math.floor(rest / (SECONDS_PER_MINUTE * MS_PER_SECOND))
  const secondsMs = rest - minutes * SECONDS_PER_MINUTE * MS_PER_SECOND
  return `${hours}:${pad(String(minutes), 2)}:${pad((secondsMs / MS_PER_SECOND).toFixed(3), 6)}`
}

export function formatStintTime(seconds: number): string {
  const tenths = Math.round(seconds * 10)
  const minutes = Math.floor(tenths / TENTHS_PER_MINUTE)
  const rest = (tenths - minutes * TENTHS_PER_MINUTE) / 10
  return `${minutes}:${pad(rest.toFixed(1), 4)}`
}

export function formatDelta(seconds: number): string {
  const sign = seconds > 0 ? '+' : seconds < 0 ? '−' : '±'
  const magnitude = Math.abs(seconds)
  const tenths = Math.round(magnitude * 10)
  if (tenths >= TENTHS_PER_MINUTE) return `${sign}${formatStintTime(magnitude)}`
  return `${sign}${(tenths / 10).toFixed(1)}s`
}
