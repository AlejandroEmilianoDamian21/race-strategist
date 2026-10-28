import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Simular</Button>)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Simular' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders the mandatory reason beside a disabled button', () => {
    render(
      <Button disabled hint="Corregí 1 error para simular">
        Simular
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Simular' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Corregí 1 error para simular')).toBeVisible()
    expect(button).toHaveAccessibleDescription('Corregí 1 error para simular')
  })

  it('shows the loading text and progress, and ignores clicks', async () => {
    const onClick = vi.fn()
    render(
      <Button loading loadingText="Simulando vuelta 34/53" progress={0.64} onClick={onClick}>
        Simular
      </Button>,
    )

    const button = screen.getByRole('button', {
      name: /Simulando vuelta 34\/53/,
    })
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.setup().click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.queryByText('Simular')).not.toBeInTheDocument()
  })

  it('marks the disabled reason with the error icon', () => {
    render(
      <Button disabled hint="Corregí 1 error para simular">
        Simular
      </Button>,
    )

    const hint = screen.getByText('Corregí 1 error para simular')
    expect(hint.querySelector('svg')).not.toBeNull()
  })

  it('applies the variant and size of the design', () => {
    render(
      <>
        <Button size="lg">Grande</Button>
        <Button variant="secondary">Borde</Button>
        <Button variant="ghost">Ghost</Button>
      </>,
    )

    const large = screen.getByRole('button', { name: 'Grande' })
    expect(large).toHaveClass('bg-accent', 'hover:bg-accent-hover', 'h-13', 'body')
    expect(large).not.toHaveClass('font-display', 'font-bold')
    expect(large).toHaveClass('tracking-[1px]', 'uppercase')
    expect(screen.getByRole('button', { name: 'Borde' })).toHaveClass('border-line-strong')
    expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('text-ink-muted', 'px-3')
  })

  it('draws the progress bar proportional to the progress', () => {
    const { container } = render(
      <Button loading loadingText="Simulando vuelta 34/53" progress={0.64}>
        Simular
      </Button>,
    )

    const bar = container.querySelector('button > span:last-child') as HTMLElement
    expect(bar.style.width).toBe('64%')
    expect(bar).toHaveClass('h-[3px]', 'bottom-0')
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button')).toHaveClass('bg-accent', 'cursor-progress')
  })
})
