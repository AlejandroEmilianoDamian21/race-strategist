import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LanguageSwitcher } from './language-switcher'

describe('LanguageSwitcher', () => {
  it('marks the current language as pressed', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches the language, persists it and updates the html lang', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('group', { name: 'Language' })).toBeVisible()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('rs-lang')).toBe('en')
  })
})
