import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from './race-fixtures'
import { TyreCompounds } from './tyre-compounds'

describe('TyreCompounds', () => {
  it('lists each compound with pace, scaled degradation and optimal rain range', () => {
    render(<TyreCompounds tyres={OVERVIEW.tyres} tyreWear={0.9} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText('Blando')).toBeVisible()
    expect(within(items[0]).getByText('S')).toBeVisible()
    expect(within(items[0]).getByText('−1.0s')).toBeVisible()
    expect(within(items[0]).getByText('+0.090s/v')).toBeVisible()
    expect(within(items[0]).getByText('0–0.05')).toBeVisible()
    expect(within(items[1]).getByText('+0.5s')).toBeVisible()
    expect(within(items[2]).getByText('Lluvia')).toBeVisible()
  })

  it('renders zero and negative scaled degradation with the matching sign', () => {
    const [soft] = OVERVIEW.tyres
    render(
      <TyreCompounds
        tyres={[
          { ...soft, compound: 'SOFT', degradation: 0 },
          { ...soft, compound: 'MEDIUM', degradation: -0.1 },
        ]}
        tyreWear={0.9}
      />,
    )

    expect(screen.getByText('±0.000s/v')).toBeVisible()
    expect(screen.getByText('−0.090s/v')).toBeVisible()
  })
})
