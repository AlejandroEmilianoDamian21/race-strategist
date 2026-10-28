import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionHead } from './section-head'

describe('SectionHead', () => {
  it('highlights only the step number in the eyebrow and renders the title and right slot', () => {
    render(<SectionHead step={1} title="Elegí una carrera" right={<span>derecha</span>} />)

    const number = screen.getByText('Paso 01')
    expect(number.tagName).toBe('B')
    expect(number).toHaveClass('text-accent-text')
    expect(number.parentElement).toHaveTextContent('Paso 01 · Carrera')
    expect(screen.getByRole('heading', { name: 'Elegí una carrera' })).toBeVisible()
    expect(screen.getByText('derecha')).toBeVisible()
  })
})
