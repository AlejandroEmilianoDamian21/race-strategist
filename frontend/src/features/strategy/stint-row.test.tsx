import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Stint } from '@/shared/api/types'
import { StintRow } from './stint-row'

interface RowOptions {
  stint?: Stint
  end?: number
  isLast?: boolean
  invalid?: boolean
  canRemove?: boolean
}

function renderRow({
  stint = { compound: 'MEDIUM', laps: 24 },
  end = 24,
  isLast = false,
  invalid = false,
  canRemove = true,
}: RowOptions = {}) {
  const handlers = {
    onCompoundChange: vi.fn(),
    onLapsChange: vi.fn(),
    onPitChange: vi.fn(),
    onRemove: vi.fn(),
  }
  render(
    <ul>
      <StintRow
        index={0}
        stint={stint}
        end={end}
        raceLaps={70}
        isLast={isLast}
        invalid={invalid}
        canRemove={canRemove}
        {...handlers}
      />
    </ul>,
  )
  return handlers
}

function EditableRow({
  initial,
  onLapsChange,
}: {
  initial: number
  onLapsChange: (laps: number) => void
}) {
  const [stint, setStint] = useState<Stint>({ compound: 'MEDIUM', laps: initial })
  return (
    <ul>
      <StintRow
        index={0}
        stint={stint}
        end={stint.laps}
        raceLaps={70}
        isLast={false}
        invalid={false}
        canRemove
        onCompoundChange={vi.fn()}
        onLapsChange={(_, laps) => {
          onLapsChange(laps)
          setStint({ ...stint, laps })
        }}
        onPitChange={vi.fn()}
        onRemove={vi.fn()}
      />
    </ul>
  )
}

describe('StintRow', () => {
  it('keeps the laps field empty while editing and types a single digit without a leading zero', async () => {
    const onLapsChange = vi.fn()
    render(<EditableRow initial={24} onLapsChange={onLapsChange} />)
    const user = userEvent.setup()
    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })

    await user.clear(input)
    expect(input).toHaveValue(null)
    await user.type(input, '3')

    expect(input).toHaveValue(3)
    expect((input as HTMLInputElement).value).toBe('3')
    expect(onLapsChange).toHaveBeenLastCalledWith(3)
  })

  it('strips leading zeros typed into the laps field', async () => {
    render(<EditableRow initial={24} onLapsChange={vi.fn()} />)
    const user = userEvent.setup()
    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })

    await user.clear(input)
    await user.type(input, '007')

    expect((input as HTMLInputElement).value).toBe('7')
  })

  it('shows the stint laps again when the field loses focus empty', async () => {
    render(<EditableRow initial={24} onLapsChange={vi.fn()} />)
    const user = userEvent.setup()
    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })

    await user.clear(input)
    await user.tab()

    expect((input as HTMLInputElement).value).toBe('0')
  })

  it('exposes the stint index and its fields so a backend violation can focus them', () => {
    renderRow()

    const row = screen.getByRole('listitem')
    expect(row).toHaveAttribute('data-stint', '0')
    expect(row.querySelector('[data-field="laps"]')).toBe(
      screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' }),
    )
    expect(row.querySelector('[data-field="compound"]')).toBe(
      screen.getByRole('radiogroup', { name: 'Compuesto del stint 1' }),
    )
  })

  it('offers the five compounds as a radio group with the chosen one checked', () => {
    renderRow()

    const group = screen.getByRole('radiogroup', { name: 'Compuesto del stint 1' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Blando',
      'Medio',
      'Duro',
      'Intermedio',
      'Lluvia',
    ])
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
      'false',
    ])
    expect(screen.getByText(/Compuesto ·/)).toHaveTextContent('Compuesto · Medio')
  })

  it('reports the compound picked', async () => {
    const { onCompoundChange } = renderRow()

    await userEvent.setup().click(screen.getByRole('radio', { name: 'Lluvia' }))

    expect(onCompoundChange).toHaveBeenCalledWith(0, 'WET')
  })

  it('keeps a single tab stop on the checked compound', () => {
    renderRow()

    const radios = within(screen.getByRole('radiogroup')).getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
      '-1',
      '-1',
    ])
  })

  it('makes the first compound tabbable when none is checked', () => {
    renderRow({ stint: { compound: 'SLICK', laps: 10 } })

    const radios = within(screen.getByRole('radiogroup')).getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1',
      '-1',
    ])
  })

  it.each([
    ['ArrowRight', 'HARD'],
    ['ArrowDown', 'HARD'],
    ['ArrowLeft', 'SOFT'],
    ['ArrowUp', 'SOFT'],
    ['Home', 'SOFT'],
    ['End', 'WET'],
  ])('selects the compound reached with %s and moves focus to it', (key, compound) => {
    const { onCompoundChange } = renderRow()
    const radios = within(screen.getByRole('radiogroup')).getAllByRole('radio')
    radios[1]?.focus()

    fireEvent.keyDown(radios[1] as HTMLElement, { key })

    expect(onCompoundChange).toHaveBeenCalledExactlyOnceWith(0, compound)
    const index = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].indexOf(compound)
    expect(radios[index]).toHaveFocus()
  })

  it('wraps around at the ends of the compound group', () => {
    const { onCompoundChange } = renderRow({ stint: { compound: 'WET', laps: 10 } })
    const radios = within(screen.getByRole('radiogroup')).getAllByRole('radio')

    fireEvent.keyDown(radios[4] as HTMLElement, { key: 'ArrowRight' })

    expect(onCompoundChange).toHaveBeenCalledExactlyOnceWith(0, 'SOFT')
  })

  it('ignores other keys in the compound group', () => {
    const { onCompoundChange } = renderRow()
    const radios = within(screen.getByRole('radiogroup')).getAllByRole('radio')

    fireEvent.keyDown(radios[1] as HTMLElement, { key: 'a' })

    expect(onCompoundChange).not.toHaveBeenCalled()
  })

  it('edits the laps and treats an empty field as zero', () => {
    const { onLapsChange } = renderRow()
    const input = screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })

    fireEvent.change(input, { target: { value: '30' } })
    fireEvent.change(input, { target: { value: '' } })

    expect(onLapsChange).toHaveBeenNthCalledWith(1, 0, 30)
    expect(onLapsChange).toHaveBeenNthCalledWith(2, 0, 0)
  })

  it('moves the pit stop with a slider and a number input bound to the end lap', () => {
    const { onPitChange } = renderRow()
    const slider = screen.getByRole('slider', { name: 'Vuelta de parada 1' })

    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '69')
    expect(slider).toHaveValue('24')
    expect(screen.getByText(/Parada en boxes ·/)).toHaveTextContent('Parada en boxes · V24')

    fireEvent.change(slider, { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/Parada en boxes/, { selector: 'input[type=number]' }), {
      target: { value: '31' },
    })
    fireEvent.change(screen.getByLabelText(/Parada en boxes/, { selector: 'input[type=number]' }), {
      target: { value: '' },
    })

    expect(onPitChange).toHaveBeenNthCalledWith(1, 0, 30)
    expect(onPitChange).toHaveBeenNthCalledWith(2, 0, 31)
    expect(onPitChange).toHaveBeenCalledTimes(2)
  })

  it('shows the flag instead of a pit stop on the last stint', () => {
    renderRow({ isLast: true, end: 70 })

    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.getByText('Termina')).toBeVisible()
    expect(screen.getByText('Bandera · V70')).toBeVisible()
  })

  it('removes the stint and disables removal when it is the only one', async () => {
    const { onRemove } = renderRow()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar stint 1' }))
    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('disables the remove button for a single stint', () => {
    renderRow({ canRemove: false })

    expect(screen.getByRole('button', { name: 'Quitar stint 1' })).toBeDisabled()
  })

  it('marks only an invalid row and its laps field', () => {
    renderRow({ invalid: true })

    expect(screen.getByRole('listitem')).toHaveAttribute('data-invalid', 'true')
    expect(screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('leaves a valid row unmarked', () => {
    renderRow()

    expect(screen.getByRole('listitem')).not.toHaveAttribute('data-invalid')
    expect(screen.getByRole('spinbutton', { name: 'Vueltas del stint 1' })).not.toHaveAttribute(
      'aria-invalid',
    )
  })

  it('shows a dash for an unknown compound and checks none', () => {
    renderRow({ stint: { compound: 'SLICK', laps: 10 } })

    expect(screen.getByText(/Compuesto ·/)).toHaveTextContent('Compuesto · —')
    expect(
      screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false'),
    ).toBe(true)
  })
})
