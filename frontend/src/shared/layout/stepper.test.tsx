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
})
