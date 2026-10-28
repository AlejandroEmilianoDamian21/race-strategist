import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MONZA } from './race-fixtures'
import { RaceCard } from './race-card'

function rainLabel(rainProbability: number) {
  render(<RaceCard race={{ ...MONZA, rainProbability }} selected={false} onSelect={vi.fn()} />)
  return screen.getByText(/lluvia/)
}

describe('RaceCard', () => {
  it('highlights the rain chip when the probability is exactly 50%', () => {
    expect(rainLabel(0.5)).toHaveClass('text-rain')
  })

  it('does not highlight the rain chip just below 50%', () => {
    expect(rainLabel(0.49)).not.toHaveClass('text-rain')
  })
})
