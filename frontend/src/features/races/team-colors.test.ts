import { describe, expect, it } from 'vitest'
import { teamColor } from './team-colors'

describe('teamColor', () => {
  it('returns the fixed color for a known team name', () => {
    expect(teamColor('Ferrari')).toBe('#e8002d')
    expect(teamColor('McLaren')).toBe('#ff8000')
  })

  it('falls back to the ink-faint token for unknown teams', () => {
    expect(teamColor('Unlisted Team')).toBe('var(--color-ink-faint)')
  })
})
