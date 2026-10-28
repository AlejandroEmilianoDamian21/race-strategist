import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MONZA } from './race-fixtures'
import { RaceCard } from './race-card'

function renderCard(overrides: Partial<typeof MONZA> = {}, selected = false, onSelect = vi.fn()) {
  render(<RaceCard race={{ ...MONZA, ...overrides }} selected={selected} onSelect={onSelect} />)
  return screen.getByRole('button')
}

function rainLabel(rainProbability: number) {
  renderCard({ rainProbability })
  return screen.getByText(/lluvia/)
}

describe('RaceCard', () => {
  it('shows the zero-padded round and the date as DD MON YYYY', () => {
    const card = renderCard({ round: 3, date: '2025-06-15' })

    expect(within(card).getByText('R03')).toBeVisible()
    expect(within(card).getByText('15 JUN 2025')).toBeVisible()
  })

  it('shows country, circuit type in lowercase Spanish and laps on one line', () => {
    const card = renderCard()

    expect(within(card).getByText('Italy · permanente · 53 v')).toBeVisible()
  })

  it('shows the temperature with its icon and the rain chance with its icon', () => {
    const card = renderCard({ temperature: 28 })

    expect(within(card).getByText('28°C').querySelector('svg')).not.toBeNull()
    expect(within(card).getByText('10% lluvia').querySelector('svg')).not.toBeNull()
  })

  it('highlights the rain chip when the probability is exactly 50%', () => {
    expect(rainLabel(0.5)).toHaveClass('text-rain')
  })

  it('does not highlight the rain chip just below 50%', () => {
    expect(rainLabel(0.49)).not.toHaveClass('text-rain')
  })

  it('marks the selected card with aria-pressed and a check at the bottom right', () => {
    const card = renderCard({}, true)

    expect(card).toHaveAttribute('aria-pressed', 'true')
    const check = card.querySelector('[data-race-check]')
    expect(check).not.toBeNull()
    expect(check).toHaveClass('bottom-3', 'right-3')
  })

  it('has no check and aria-pressed false when not selected', () => {
    const card = renderCard()

    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(card.querySelector('[data-race-check]')).toBeNull()
  })

  it('reports its race id when clicked', async () => {
    const onSelect = vi.fn()
    const card = renderCard({}, false, onSelect)

    await userEvent.setup().click(card)

    expect(onSelect).toHaveBeenCalledWith('italian-gp')
  })
})
