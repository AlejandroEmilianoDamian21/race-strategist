import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@/shared/i18n'
import App from '@/App'

describe('App', () => {
  it('shows the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Race Strategist' })).toBeVisible()
  })
})
