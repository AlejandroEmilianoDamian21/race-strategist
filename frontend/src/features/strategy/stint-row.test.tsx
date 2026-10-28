import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Stint, StrategyViolation } from '@/shared/api/types'
import { StintRow } from './stint-row'

const SHORT: StrategyViolation = {
  code: 'STINT_TOO_SHORT',
  field: 'stints[1].laps',
  params: { stint: 2, laps: 0 },
  message: 'raw',
}

const UNKNOWN: StrategyViolation = {
  code: 'UNKNOWN_COMPOUND',
  field: 'stints[1].compound',
  params: { stint: 2, compound: 'SLICK', allowed: 'SOFT, MEDIUM' },
  message: 'raw',
}

function renderRow(
  stint: Stint = { compound: 'MEDIUM', laps: 23 },
  options: { errors?: StrategyViolation[]; canRemove?: boolean; index?: number } = {},
) {
  const handlers = {
    onCompoundChange: vi.fn(),
    onLapsChange: vi.fn(),
    onRemove: vi.fn(),
  }
  render(
    <ul>
      <StintRow
        index={options.index ?? 1}
        stint={stint}
        errors={options.errors ?? []}
        canRemove={options.canRemove ?? true}
        {...handlers}
      />
    </ul>,
  )
  return handlers
}

describe('StintRow', () => {
  it('shows the stint number, compound and laps', () => {
    renderRow()

    expect(screen.getByText('Stint 2')).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Compuesto del stint 2' })).toHaveValue('MEDIUM')
    expect(screen.getByRole('spinbutton', { name: 'Vueltas del stint 2' })).toHaveValue(23)
    expect(screen.getByRole('img', { name: 'Medio' })).toBeVisible()
  })

  it('offers the five compounds by name', () => {
    renderRow()

    const options = screen
      .getAllByRole('option')
      .map((option) => [option.getAttribute('value'), option.textContent])
    expect(options).toEqual([
      ['SOFT', 'Blando'],
      ['MEDIUM', 'Medio'],
      ['HARD', 'Duro'],
      ['INTERMEDIATE', 'Intermedio'],
      ['WET', 'Lluvia'],
    ])
  })

  it('reports compound changes with the row index', async () => {
    const { onCompoundChange } = renderRow()

    await userEvent
      .setup()
      .selectOptions(screen.getByRole('combobox', { name: 'Compuesto del stint 2' }), 'HARD')

    expect(onCompoundChange).toHaveBeenCalledWith(1, 'HARD')
  })

  it('reports laps as numbers and maps an emptied field to zero', () => {
    const { onLapsChange } = renderRow()
    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 2' })

    fireEvent.change(input, { target: { value: '30' } })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.change(input, { target: { value: '1.5' } })

    expect(onLapsChange.mock.calls).toEqual([
      [1, 30],
      [1, 0],
      [1, 1.5],
    ])
  })

  it('shows zero laps as an empty field so typing is not blocked', () => {
    renderRow({ compound: 'MEDIUM', laps: 0 })

    expect(screen.getByRole('spinbutton', { name: 'Vueltas del stint 2' })).toHaveValue(null)
  })

  it('removes the stint, and disables removal when it is the only one', async () => {
    const { onRemove } = renderRow()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar el stint 2' }))
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('disables removal for the last remaining stint', () => {
    renderRow(undefined, { canRemove: false })

    expect(screen.getByRole('button', { name: 'Quitar el stint 2' })).toBeDisabled()
  })

  it('links the laps error to the input with aria-invalid and aria-describedby', () => {
    renderRow({ compound: 'MEDIUM', laps: 0 }, { errors: [SHORT] })

    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 2' })
    const message = screen.getByText(
      'El stint 2 tiene 0 vueltas. Cada stint necesita al menos 1 vuelta entera.',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(message.textContent ?? '')
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid')
  })

  it('links a compound error to the select', () => {
    renderRow({ compound: 'SLICK', laps: 10 }, { errors: [UNKNOWN] })

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-invalid')
  })

  it('is not invalid without errors', () => {
    renderRow()

    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('aria-describedby')
  })
})
