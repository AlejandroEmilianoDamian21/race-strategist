import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OVERVIEW } from '@/features/races/race-fixtures'
import { DriverSelect } from './driver-select'

function renderSelect(driverId: string | null) {
  const onSelect = vi.fn()
  render(<DriverSelect teams={OVERVIEW.teams} driverId={driverId} onSelect={onSelect} />)
  return onSelect
}

describe('DriverSelect', () => {
  it('groups drivers by team and labels them with number and name', () => {
    renderSelect('leclerc')

    const ferrari = screen.getByRole('group', { name: 'Ferrari' })
    expect(
      within(ferrari)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['#16 Charles Leclerc', '#44 Lewis Hamilton'])
    expect(screen.getByRole('group', { name: 'Unlisted Team' })).toBeVisible()
  })

  it('shows the selected driver', () => {
    renderSelect('hamilton')

    expect(screen.getByRole('combobox', { name: 'Piloto' })).toHaveValue('hamilton')
  })

  it('offers a placeholder while no driver is selected', () => {
    renderSelect(null)

    expect(screen.getByRole('combobox', { name: 'Piloto' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Elegí un piloto' })).toBeVisible()
  })

  it('reports the chosen driver id', async () => {
    const onSelect = renderSelect('leclerc')

    await userEvent
      .setup()
      .selectOptions(screen.getByRole('combobox', { name: 'Piloto' }), 'rookie')

    expect(onSelect).toHaveBeenCalledWith('rookie')
  })
})
