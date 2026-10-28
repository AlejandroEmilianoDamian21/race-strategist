import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Tyre } from '@/shared/api/types'
import { OVERVIEW } from './race-fixtures'
import { WeatherTimeline } from './weather-timeline'

function tyre(compound: Tyre['compound'], min: number, max: number): Tyre {
  return {
    compound,
    pace: 0,
    degradation: 0.05,
    wetPerformance: 0.5,
    optimalRainIntensity: { min, max },
  }
}

const TYRES: Tyre[] = [
  tyre('SOFT', 0, 0.05),
  tyre('HARD', 0, 0.1),
  tyre('INTERMEDIATE', 0.2, 0.7),
  tyre('WET', 0.6, 1),
]

function renderWeather(weather = OVERVIEW.weather, tyres = TYRES, laps = 53) {
  render(<WeatherTimeline weather={weather} tyres={tyres} laps={laps} rainProbability={0.65} />)
}

describe('WeatherTimeline', () => {
  it('captions the card with the race rain probability', () => {
    renderWeather()

    expect(screen.getByRole('heading', { name: 'Clima durante la carrera' })).toBeVisible()
    expect(screen.getByText('Probabilidad de lluvia 65%')).toBeVisible()
  })

  it('quotes the summary in italics, in English as it comes', () => {
    renderWeather()

    const quote = screen.getByText('“Dry start, light rain in the closing laps.”')
    expect(quote.tagName).toBe('BLOCKQUOTE')
    expect(quote).toHaveAttribute('lang', 'en')
    expect(quote).toHaveClass('italic')
  })

  it('draws one band segment per forecast on the lap scale with sun or drop icons', () => {
    renderWeather()

    const band = screen.getByRole('list', { name: 'Clima por tramos' })
    const segments = within(band).getAllByRole('listitem')
    expect(segments).toHaveLength(2)
    expect(segments[0].style.flex).toMatch(/^30 1 0/)
    expect(segments[1].style.flex).toMatch(/^23 1 0/)
    expect(segments[0]).toHaveTextContent('V1–30 · 28° · seco')
    expect(segments[1]).toHaveTextContent('V31–53 · 24° · 0.35')
    expect(segments[0].querySelector('svg path')?.getAttribute('d')).toMatch(/^M10 2v2/)
    expect(segments[1].querySelector('svg path')?.getAttribute('d')).toMatch(/^M10 2\.5S/)
  })

  it('tints only wet segments, up to 60% of rain over surface-2', () => {
    renderWeather({
      summary: 'Storm',
      forecast: [
        { fromLap: 1, toLap: 10, temperature: 20, rainIntensity: 0 },
        { fromLap: 11, toLap: 20, temperature: 20, rainIntensity: 0.35 },
        { fromLap: 21, toLap: 30, temperature: 20, rainIntensity: 0.95 },
      ],
    })

    const segments = within(screen.getByRole('list', { name: 'Clima por tramos' })).getAllByRole(
      'listitem',
    )
    expect(segments[0].style.getPropertyValue('--a')).toBe('')
    expect(segments[0]).not.toHaveAttribute('data-wet')
    expect(segments[1]).toHaveAttribute('data-wet', 'true')
    expect(segments[1].style.getPropertyValue('--a')).toBe('0.34')
    expect(segments[2].style.getPropertyValue('--a')).toBe('0.60')
  })

  it('shows the ideal compounds per segment and describes each one for assistive tech', () => {
    renderWeather()

    const segments = within(screen.getByRole('list', { name: 'Clima por tramos' })).getAllByRole(
      'listitem',
    )
    expect(segments[0]).toHaveAccessibleName('V1–V30: Seco (0), 28°C. Ideal: Blando, Duro')
    expect(segments[0]).toHaveAttribute('title', 'V1–V30: Seco (0), 28°C. Ideal: Blando, Duro')
    expect(segments[1]).toHaveAccessibleName(
      'V31–V53: Lluvia moderada (0.35), 24°C. Ideal: Intermedio',
    )
    expect(segments[0].textContent).toContain('SH')
    expect(segments[1].textContent).toContain('I')
  })

  it('shares the lap scale with the band through the axis', () => {
    renderWeather()

    expect(screen.getByText('V1')).toBeInTheDocument()
    expect(screen.getByText('V53')).toBeInTheDocument()
    expect(screen.getByText('Tramos de la carrera · ideal por banda de lluvia')).toBeVisible()
  })

  it('lists one card per segment with range, wording, temperature, intensity and ideal compounds', () => {
    renderWeather()

    const cards = screen.getAllByTestId('weather-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('V1–V30 · Seco')
    expect(cards[0]).toHaveTextContent('28°C · intensidad 0 · ideal Blando, Duro')
    expect(cards[0]).not.toHaveClass('outline-rain')
    expect(cards[1]).toHaveTextContent('V31–V53 · Lluvia moderada')
    expect(cards[1]).toHaveTextContent('24°C · intensidad 0.35 · ideal Intermedio')
    expect(cards[1]).toHaveClass('outline-1', 'outline-rain')
  })

  it('omits the ideal part when no compound fits a segment', () => {
    renderWeather(
      {
        summary: 'Test',
        forecast: [{ fromLap: 1, toLap: 10, temperature: 20, rainIntensity: 0.15 }],
      },
      [tyre('SOFT', 0, 0.05)],
      10,
    )

    expect(screen.getByTestId('weather-card')).toHaveTextContent('20°C · intensidad 0.15')
    expect(screen.getByTestId('weather-card')).not.toHaveTextContent('ideal')
  })

  it.each([
    [0, 'Seco'],
    [0.05, 'Llovizna'],
    [0.14, 'Llovizna'],
    [0.15, 'Lluvia moderada'],
    [0.54, 'Lluvia moderada'],
    [0.55, 'Lluvia fuerte'],
    [0.9, 'Lluvia fuerte'],
  ])('labels a rain intensity of %s as "%s"', (rainIntensity, label) => {
    renderWeather({
      summary: 'Test',
      forecast: [{ fromLap: 1, toLap: 10, temperature: 20, rainIntensity }],
    })

    expect(screen.getByTestId('weather-card')).toHaveTextContent(`V1–V10 · ${label}`)
  })
})
