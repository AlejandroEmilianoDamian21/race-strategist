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
})
