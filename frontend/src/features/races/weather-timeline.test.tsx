import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OVERVIEW } from './race-fixtures'
import { WeatherTimeline } from './weather-timeline'

describe('WeatherTimeline', () => {
  it('quotes the summary as-is and renders one tile per segment', () => {
    render(<WeatherTimeline weather={OVERVIEW.weather} />)

    expect(screen.getByText('“Dry start, light rain in the closing laps.”')).toBeVisible()
    const tiles = screen.getAllByRole('listitem')
    expect(tiles).toHaveLength(2)
    expect(tiles[0]).toHaveTextContent('V1–V30')
    expect(tiles[0]).toHaveTextContent('28°C')
    expect(tiles[0]).toHaveTextContent('Seco')
    expect(tiles[1]).toHaveTextContent('V31–V53')
    expect(tiles[1]).toHaveTextContent('24°C')
    expect(tiles[1]).toHaveTextContent('Lluvia moderada')
    expect(tiles[1]).toHaveTextContent('0.35')
  })

  it.each([
    [0, 'Seco'],
    [0.05, 'Lluvia ligera'],
    [0.2, 'Lluvia ligera'],
    [0.21, 'Lluvia moderada'],
    [0.5, 'Lluvia moderada'],
    [0.51, 'Lluvia intensa'],
    [0.9, 'Lluvia intensa'],
  ])('labels a rain intensity of %s as "%s"', (rainIntensity, label) => {
    render(
      <WeatherTimeline
        weather={{
          summary: 'Test',
          forecast: [{ fromLap: 1, toLap: 10, temperature: 20, rainIntensity }],
        }}
      />,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent(label)
  })
})
