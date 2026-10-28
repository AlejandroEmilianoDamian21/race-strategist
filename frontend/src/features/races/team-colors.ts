const TEAM_COLORS: Record<string, string> = {
  McLaren: '#ff8000',
  'Red Bull Racing': '#3671c6',
  Ferrari: '#e8002d',
  Mercedes: '#27f4d2',
  Williams: '#64c4ff',
  'Racing Bulls': '#6692ff',
  Haas: '#b6babd',
  'Aston Martin': '#229971',
  Alpine: '#ff87bc',
  'Kick Sauber': '#52e252',
}

export const TEAM_COLOR_FALLBACK = 'var(--color-ink-faint)'

export function teamColor(teamName: string): string {
  return TEAM_COLORS[teamName] ?? TEAM_COLOR_FALLBACK
}
