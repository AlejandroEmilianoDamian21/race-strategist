import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './app-shell'
import { MobileCta } from './mobile-cta'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AppShell', () => {
  it('keeps the header sticky under a 4px brand strip', () => {
    const { container } = render(<AppShell>content</AppShell>)

    expect(container.querySelector('header')).toHaveClass('sticky', 'top-0', 'z-10')
    expect(container.firstElementChild?.firstElementChild).toHaveClass('h-1', 'bg-accent')
  })

  it('lets the stepper column shrink so mid widths never scroll sideways', () => {
    const { container } = render(<AppShell>content</AppShell>)

    expect(container.querySelector('header > div')).toHaveClass(
      'min-[721px]:grid-cols-[auto_minmax(0,1fr)_auto]',
    )
  })

  it('frames the page in the 1232px main with 16px gutters', () => {
    render(<AppShell>content</AppShell>)

    expect(screen.getByRole('main')).toHaveClass('max-w-[1232px]', 'px-4', 'pt-8', 'pb-16')
  })

  it('follows the section in view in the stepper', () => {
    const tops: Record<string, number> = { 'step-race': 130, 'step-strategy': 900 }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return { top: tops[this.id] ?? 0 } as DOMRect
    })
    render(
      <AppShell>
        <section id="step-race" />
        <section id="step-strategy" />
      </AppShell>,
    )
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step')

    tops['step-race'] = -800
    tops['step-strategy'] = 90
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  })

  it('hosts the sticky mobile action bar after the main content, hidden while empty', () => {
    const { container } = render(
      <AppShell>
        <MobileCta>
          <button type="button">Simular</button>
        </MobileCta>
      </AppShell>,
    )

    const host = screen.getByRole('button', { name: 'Simular' }).parentElement as HTMLElement
    expect(host).toHaveClass('sticky', 'bottom-0', 'z-[9]', 'border-t', 'border-line', 'bg-bg')
    expect(host).toHaveClass('hidden', 'max-[720px]:flex', 'empty:invisible')
    expect(container.querySelector('main')?.nextElementSibling).toBe(host)
  })
})
