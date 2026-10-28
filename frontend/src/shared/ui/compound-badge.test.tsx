import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompoundBadge } from './compound-badge'

describe('CompoundBadge', () => {
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
