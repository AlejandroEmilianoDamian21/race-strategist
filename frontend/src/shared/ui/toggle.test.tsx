import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toggle } from './toggle'

describe('Toggle', () => {
  it('is a labelled checkbox that reports changes', async () => {
    const onChange = vi.fn()
    render(
      <Toggle checked onChange={onChange}>
        Comparar con la anterior
      </Toggle>,
    )

    const checkbox = screen.getByRole('checkbox', { name: 'Comparar con la anterior' })
    expect(checkbox).toBeChecked()
    await userEvent.setup().click(checkbox)
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
