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

describe('lapTicks bounds', () => {
  it('keeps the tick count bounded for any total', () => {
    for (const total of [1000, 100000, 1e9, 1e15, Number.MAX_SAFE_INTEGER]) {
      const ticks = lapTicks(total)
      expect(ticks.length).toBeLessThanOrEqual(14)
      expect(ticks[0]).toBe(1)
      expect(ticks.at(-1)).toBe(total)
    }
  })

  it('falls back to a single tick when the total is not a finite number', () => {
    expect(lapTicks(Number.POSITIVE_INFINITY)).toEqual([1])
    expect(lapTicks(Number.NaN)).toEqual([1])
  })

  it('keeps ticks ascending with a wider step on long totals', () => {
    const ticks = lapTicks(500)
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b))
    expect(ticks.length).toBeLessThanOrEqual(14)
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
