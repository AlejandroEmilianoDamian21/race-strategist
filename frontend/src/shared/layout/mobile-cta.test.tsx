import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MobileCta } from './mobile-cta'
import { MobileCtaHostContext } from './mobile-cta-host'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('MobileCta', () => {
  it('renders its children inside the host element', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    render(
      <MobileCtaHostContext.Provider value={host}>
        <MobileCta>
          <button type="button">Simular</button>
        </MobileCta>
      </MobileCtaHostContext.Provider>,
    )

    expect(host).toContainElement(screen.getByRole('button', { name: 'Simular' }))
  })

  it('renders nothing without a host', () => {
    render(
      <MobileCta>
        <button type="button">Simular</button>
      </MobileCta>,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
