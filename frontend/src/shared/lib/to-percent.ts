export function toPercent(value: number, max: number): number {
  if (Number.isNaN(value) || Number.isNaN(max) || value <= 0) return 0
  if (value === Infinity || max <= 0) return 100
  return Math.min(100, (value / max) * 100)
}
