import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MONACO, MONZA } from './race-fixtures'
import { RacePicker, RacePickerSkeleton } from './race-picker'

describe('RacePicker', () => {
  it('shows round, name, date, country, type, laps, temperature and rain on each card', () => {
    render(<RacePicker races={[MONZA, MONACO]} selectedId={null} onSelect={vi.fn()} />)

    const monza = screen.getByRole('button', { name: /Italian Grand Prix/ })
    expect(within(monza).getByText('R03')).toBeVisible()
    expect(within(monza).getByText('Italian Grand Prix')).toBeVisible()
    expect(within(monza).getByText(/6 (de )?sep/i)).toBeVisible()
    expect(within(monza).getByText('Italy · permanente · 53 v')).toBeVisible()
    expect(within(monza).getByText('28°C')).toBeVisible()
    expect(within(monza).getByText('10% lluvia')).toBeVisible()
    const monaco = screen.getByRole('button', { name: /Monaco Grand Prix/ })
    expect(within(monaco).getByText('Monaco · callejero · 78 v')).toBeVisible()
  })

  it('flags only the selected race with aria-pressed', () => {
    render(<RacePicker races={[MONZA, MONACO]} selectedId="monaco-gp" onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Monaco Grand Prix/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Italian Grand Prix/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reports the clicked race id', async () => {
    const onSelect = vi.fn()
    render(<RacePicker races={[MONZA, MONACO]} selectedId={null} onSelect={onSelect} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /Italian Grand Prix/ }))

    expect(onSelect).toHaveBeenCalledWith('italian-gp')
  })

  it('falls back to the raw circuit type when it has no translation', () => {
    const odd = { ...MONZA, circuit: { ...MONZA.circuit, type: 'oval' } }
    render(<RacePicker races={[odd]} selectedId={null} onSelect={vi.fn()} />)

    expect(screen.getByText('Italy · oval · 53 v')).toBeVisible()
  })

  it('renders eight skeleton cards while loading', () => {
    const { container } = render(<RacePickerSkeleton />)

    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
  })
})
