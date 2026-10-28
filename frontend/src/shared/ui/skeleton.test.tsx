import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders the shimmer class hidden from assistive technology', () => {
    const { container } = render(<Skeleton />)
    const element = container.firstElementChild

    expect(element).toHaveClass('skeleton')
    expect(element).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the caller classes next to the shimmer class', () => {
    const { container } = render(<Skeleton className="h-4 rounded-full" />)

    expect(container.firstElementChild).toHaveClass('skeleton', 'h-4', 'rounded-full')
  })
})
