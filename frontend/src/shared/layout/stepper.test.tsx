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

  it('truncates labels with an ellipsis at mid widths instead of hiding them', () => {
    render(<Stepper activeStep={2} />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => expect(button).toHaveClass('truncate'))
    const labels = buttons.map((button) => button.querySelector('[data-step-label]'))
    labels.forEach((label) => expect(label?.className).not.toContain('sr-only'))
    expect(labels[0]).toHaveTextContent('Carrera')
    expect(labels[2]).toHaveTextContent('Estrategia')
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

  it('sends the Simular step to the strategy section, which holds the action', async () => {
    const section = document.createElement('section')
    section.id = 'step-strategy'
    const scrollIntoView = vi.fn()
    section.scrollIntoView = scrollIntoView
    document.body.appendChild(section)
    render(<Stepper activeStep={1} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /Simular/ }))

    expect(scrollIntoView).toHaveBeenCalledOnce()
    section.remove()
  })

  it('switches to the desktop layout above 720px, like the mobile text switches below it', () => {
    const { container } = render(<Stepper activeStep={1} />)

    expect(screen.getByRole('list')).toHaveClass('min-[721px]:flex')
    expect(container.querySelector('[role="progressbar"]')).toHaveClass('min-[721px]:hidden')
  })
})
