import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '@/shared/i18n'
import { StrategyFacts } from './strategy-facts'

const DRIVER = { teamName: 'McLaren', carPerformance: 0.99, pace: 0.98 }

function renderFacts(
  overrides: Partial<{ minimumPitStops: number; driver: typeof DRIVER | null }> = {},
) {
  return render(
    <StrategyFacts
      pitStopLoss={19.5}
      tyreChangeTime={2.5}
      minimumPitStops={1}
      driver={DRIVER}
      {...overrides}
    />,
  )
}

describe('StrategyFacts', () => {
  it('shows team, car and pace with the team color', () => {
    renderFacts()

    const fact = screen.getByText('McLaren · auto 0.99 · ritmo 0.98')
    expect(fact).toBeVisible()
    expect(fact.parentElement?.querySelector('i')).not.toBeNull()
  })

  it('shows the pit cost as the sum of lane loss and tyre change', () => {
    renderFacts()

    const fact = screen.getByText(/Parada 19\.5 \+ 2\.5 =/)
    expect(fact).toHaveTextContent('Parada 19.5 + 2.5 = 22.0s')
    expect(within(fact).getByText('22.0s').tagName).toBe('B')
  })

  it('shows the minimum pit stops with singular and plural', () => {
    const { unmount } = renderFacts({ minimumPitStops: 1 })
    expect(screen.getByText(/Mínimo/)).toHaveTextContent('Mínimo 1 parada')
    unmount()

    renderFacts({ minimumPitStops: 2 })
    expect(screen.getByText(/Mínimo/)).toHaveTextContent('Mínimo 2 paradas')
  })

  it('omits the team fact until a driver is picked', () => {
    renderFacts({ driver: null })

    expect(screen.queryByText(/auto/)).not.toBeInTheDocument()
    expect(screen.getByText(/Parada/)).toBeVisible()
  })

  it('translates to English', async () => {
    await i18n.changeLanguage('en')
    renderFacts()

    expect(screen.getByText(/Pit 19\.5/)).toHaveTextContent('Pit 19.5 + 2.5 = 22.0s')
    expect(screen.getByText('McLaren · car 0.99 · pace 0.98')).toBeVisible()
  })
})
