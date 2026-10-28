import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DriverGrid } from './driver-grid'
import { OVERVIEW } from './race-fixtures'

describe('DriverGrid', () => {
  it('groups drivers by team with the team color strip', () => {
    render(<DriverGrid teams={OVERVIEW.teams} selectedId={null} onSelect={vi.fn()} />)

    const groups = screen.getAllByRole('group')
    expect(groups).toHaveLength(2)
    expect(within(groups[0]).getByText('Ferrari')).toBeVisible()
    expect(within(groups[0]).getAllByRole('button')).toHaveLength(2)
    expect(groups[0]).toHaveStyle({ '--team': '#e8002d' })
    expect(groups[1]).toHaveStyle({ '--team': 'var(--color-ink-faint)' })
  })

  it('shows number, name and pace on each driver', () => {
    render(<DriverGrid teams={OVERVIEW.teams} selectedId={null} onSelect={vi.fn()} />)

    const leclerc = screen.getByRole('button', { name: /Charles Leclerc/ })
    expect(within(leclerc).getByText('16')).toBeVisible()
    expect(within(leclerc).getByText('0.97')).toBeVisible()
  })

  it('flags the selected driver and reports clicks', async () => {
    const onSelect = vi.fn()
    render(<DriverGrid teams={OVERVIEW.teams} selectedId="hamilton" onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: /Lewis Hamilton/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /Charles Leclerc/ }))
    expect(onSelect).toHaveBeenCalledWith('leclerc')
  })
})
