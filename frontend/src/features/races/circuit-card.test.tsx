import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CircuitCard } from './circuit-card'
import { OVERVIEW } from './race-fixtures'

describe('CircuitCard', () => {
  it('shows the circuit identity and numbers', () => {
    render(<CircuitCard circuit={OVERVIEW.circuit} parameters={OVERVIEW.parameters} />)

    expect(screen.getByRole('heading', { name: 'Autodromo Nazionale Monza' })).toBeVisible()
    expect(screen.getByText(/Italy · Permanente/)).toBeVisible()
    expect(screen.getByText('53')).toBeVisible()
    expect(screen.getByText('5.793')).toBeVisible()
    expect(screen.getByText('307.0')).toBeVisible()
    expect(screen.getByText('1:21.500')).toBeVisible()
  })

  it('exposes the three meters', () => {
    render(<CircuitCard circuit={OVERVIEW.circuit} parameters={OVERVIEW.parameters} />)

    expect(screen.getByRole('meter', { name: 'Desgaste de neumáticos' })).toHaveAttribute(
      'aria-valuenow',
      '0.9',
    )
    expect(screen.getByRole('meter', { name: 'Dificultad para adelantar' })).toHaveAttribute(
      'aria-valuenow',
      '0.4',
    )
    expect(screen.getByRole('meter', { name: 'Probabilidad de safety car' })).toHaveAttribute(
      'aria-valuenow',
      '0.25',
    )
    expect(screen.getByText('25%')).toBeVisible()
  })
})
