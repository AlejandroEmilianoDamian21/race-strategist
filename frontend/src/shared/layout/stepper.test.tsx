import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/shared/i18n'
import { Stepper } from './stepper'

describe('Stepper', () => {
  it('lists the five steps and flags only the active one', () => {
    render(<Stepper activeStep={3} />)

    const list = screen.getByRole('list')
    const items = Array.from(list.querySelectorAll('li'))
    expect(items).toHaveLength(5)
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
      null,
    ])
    expect(items[2]).toHaveTextContent('Estrategia')
  })

  it('shows the compact progress text for small screens', () => {
    render(<Stepper activeStep={3} />)

    expect(screen.getByRole('progressbar', { name: 'Paso 3 de 5 · Estrategia' })).toHaveAttribute(
      'aria-valuenow',
      '3',
    )
  })

  it('keeps labels readable at mid widths by collapsing only the inactive ones', () => {
    render(<Stepper activeStep={2} />)

    const items = Array.from(screen.getByRole('list').querySelectorAll('li'))
    items.forEach((item) => expect(item.className).not.toMatch(/\btruncate\b/))
    const labels = items.map((item) => item.querySelector('[data-step-label]'))
    expect(labels[1]?.className).not.toContain('sr-only')
    expect(labels[0]?.className).toContain('max-[1099px]:sr-only')
    expect(labels[2]?.className).toContain('max-[1099px]:sr-only')
    expect(labels[0]).toHaveTextContent('Carrera')
  })

  it('renders the mobile text with the emphasized parts', () => {
    const { container } = render(<Stepper activeStep={3} />)

    const bolds = Array.from(container.querySelectorAll('[role="progressbar"] b')).map(
      (node) => node.textContent,
    )
    expect(bolds).toEqual(['3', 'Estrategia'])
    expect(screen.getByText(/de 5 ·/)).toHaveTextContent('Paso 3 de 5 · Estrategia')
  })

  it('translates the mobile text to English', async () => {
    await i18n.changeLanguage('en')
    render(<Stepper activeStep={2} />)

    expect(screen.getByRole('progressbar', { name: 'Step 2 of 5 · Info' })).toBeInTheDocument()
    expect(screen.getByText(/of 5 ·/)).toHaveTextContent('Step 2 of 5 · Info')
  })

  it('draws the progress bar at the active proportion', () => {
    const { container } = render(<Stepper activeStep={3} />)

    const fill = container.querySelector('[role="progressbar"] .bg-accent') as HTMLElement
    expect(fill.style.width).toBe('60%')
  })

  it('colors the steps by state', () => {
    render(<Stepper activeStep={3} />)

    const items = Array.from(screen.getByRole('list').querySelectorAll('li'))
    expect(items[0]).toHaveClass('border-ink-muted', 'text-ink-muted')
    expect(items[2]).toHaveClass('border-accent', 'text-ink')
    expect(items[3]).toHaveClass('border-surface-3', 'text-ink-faint')
    expect(items[2].querySelector('span')).toHaveClass('font-mono')
  })

  it('makes every step a button that scrolls to its section', async () => {
    const section = document.createElement('section')
    section.id = 'step-strategy'
    const scrollIntoView = vi.fn()
    section.scrollIntoView = scrollIntoView
    document.body.appendChild(section)
    render(<Stepper activeStep={1} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    await userEvent.setup().click(screen.getByRole('button', { name: /Estrategia/ }))
    expect(scrollIntoView).toHaveBeenCalledOnce()
    section.remove()
  })
})
