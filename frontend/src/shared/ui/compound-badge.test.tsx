import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompoundBadge, TyreChip } from './compound-badge'

describe('CompoundBadge', () => {
  it('chip renders the letter with the translated compound name', () => {
    render(<TyreChip compound="INTERMEDIATE" />)

    expect(screen.getByText('I')).toBeVisible()
    expect(screen.getByText('Intermedio')).toBeVisible()
  })

  it('exposes the name to assistive tech when the label is hidden', () => {
    render(<CompoundBadge compound="SOFT" />)

    expect(screen.getByLabelText('Blando')).toHaveTextContent('S')
  })

  it('uses the design sizes', () => {
    render(
      <>
        <CompoundBadge compound="SOFT" size="sm" />
        <CompoundBadge compound="MEDIUM" />
        <CompoundBadge compound="HARD" size="lg" />
      </>,
    )

    expect(screen.getByLabelText('Blando')).toHaveClass('size-5', 'border-2', 'text-[11px]')
    expect(screen.getByLabelText('Medio')).toHaveClass('size-7', 'border-[3px]', 'text-[15px]')
    expect(screen.getByLabelText('Medio')).toHaveClass('font-extrabold')
    expect(screen.getByLabelText('Duro')).toHaveClass('size-11', 'border-[5px]', 'text-[22px]')
  })

  it('colors the ring and letter with the tyre token', () => {
    render(<CompoundBadge compound="WET" />)

    expect(screen.getByLabelText('Lluvia')).toHaveClass('border-tyre-wet', 'text-tyre-wet')
  })

  it('TyreChip pairs the badge with the name and forwards the size', () => {
    const { container } = render(<TyreChip compound="HARD" size="sm" />)

    expect(screen.getByText('Duro')).toBeVisible()
    expect(screen.getByText('H')).toHaveClass('size-5')
    expect(container.firstChild).toHaveClass('gap-2', 'font-semibold')
  })
})
