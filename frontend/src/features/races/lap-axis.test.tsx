import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LapAxis } from './lap-axis'
import { lapTicks } from './lap-ticks'

describe('lapTicks', () => {
  it('starts at 1, steps by 10 and ends at the last lap', () => {
    expect(lapTicks(70)).toEqual([1, 10, 20, 30, 40, 50, 60, 70])
  })

  it('drops a step tick that would crowd the last lap', () => {
    expect(lapTicks(53)).toEqual([1, 10, 20, 30, 40, 53])
    expect(lapTicks(54)).toEqual([1, 10, 20, 30, 40, 54])
    expect(lapTicks(55)).toEqual([1, 10, 20, 30, 40, 50, 55])
  })
})

describe('LapAxis', () => {
  it('labels the ticks with the lap prefix and positions them on the lap scale', () => {
    const { container } = render(<LapAxis total={50} />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('V1')).toHaveStyle({ left: '0%' })
    expect(screen.getByText('V10')).toHaveStyle({ left: '20%' })
    expect(screen.getByText('V50')).toHaveStyle({ left: '100%' })
  })
})
