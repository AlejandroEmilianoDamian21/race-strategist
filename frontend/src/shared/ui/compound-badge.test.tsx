import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompoundBadge } from './compound-badge'
import { COMPOUND_LETTER } from './compound-letter'

describe('CompoundBadge', () => {
  it('maps every compound to its letter', () => {
    expect(COMPOUND_LETTER).toEqual({
      SOFT: 'S',
      MEDIUM: 'M',
      HARD: 'H',
      INTERMEDIATE: 'I',
      WET: 'W',
    })
  })

  it('renders the letter with the translated compound name', () => {
    render(<CompoundBadge compound="INTERMEDIATE" showName />)

    expect(screen.getByText('I')).toBeVisible()
    expect(screen.getByText('Intermedio')).toBeVisible()
  })

  it('exposes the name to assistive tech when the label is hidden', () => {
    render(<CompoundBadge compound="SOFT" />)

    expect(screen.getByLabelText('Blando')).toHaveTextContent('S')
  })
})
