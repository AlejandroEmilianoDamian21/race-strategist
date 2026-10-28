import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Stepper } from './stepper'

describe('Stepper', () => {
  it('lists the five steps and flags only the active one', () => {
    render(<Stepper activeStep={3} />)

    const list = screen.getByRole('list')
    const items = Array.from(list.querySelectorAll('li'))
    expect(items).toHaveLength(5)
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
      null,
    ])
    expect(items[2]).toHaveTextContent('Estrategia')
  })

  it('shows the compact progress text for small screens', () => {
    render(<Stepper activeStep={3} />)

    expect(screen.getByRole('progressbar', { name: 'Paso 3 de 5 · Estrategia' })).toHaveAttribute(
      'aria-valuenow',
      '3',
    )
  })

  it('keeps labels readable at mid widths by collapsing only the inactive ones', () => {
    render(<Stepper activeStep={2} />)

    const items = Array.from(screen.getByRole('list').querySelectorAll('li'))
    items.forEach((item) => expect(item.className).not.toMatch(/\btruncate\b/))
    const labels = items.map((item) => item.querySelector('[data-step-label]'))
    expect(labels[1]?.className).not.toContain('sr-only')
    expect(labels[0]?.className).toContain('max-[1099px]:sr-only')
    expect(labels[2]?.className).toContain('max-[1099px]:sr-only')
    expect(labels[0]).toHaveTextContent('Carrera')
  })
})
