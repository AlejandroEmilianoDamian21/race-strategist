import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useActiveStep } from './use-active-step'

const IDS = ['step-race', 'step-info', 'step-strategy', 'step-result']

function place(tops: number[]) {
  IDS.forEach((id, index) => {
    const section = document.getElementById(id) as HTMLElement
    section.getBoundingClientRect = () => ({ top: tops[index] }) as DOMRect
  })
}

function scroll() {
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

function setDocument(scrollY: number, scrollHeight: number, innerHeight: number) {
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  })
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  for (const id of IDS) {
    const section = document.createElement('section')
    section.id = id
    document.body.appendChild(section)
  }
  setDocument(0, 5000, 800)
  place([130, 700, 1500, 2600])
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useActiveStep', () => {
  it('starts on the step of the section under the header', () => {
    const { result } = renderHook(() => useActiveStep())

    expect(result.current).toBe(1)
  })

  it('moves to a section once its top passes the reading line below the header', () => {
    const { result } = renderHook(() => useActiveStep())

    place([-570, 0, 800, 1900])
    scroll()
    expect(result.current).toBe(2)

    place([-1370, -800, 90, 1100])
    scroll()
    expect(result.current).toBe(3)
  })

  it('keeps the previous section while the next one is still below the reading line', () => {
    const { result } = renderHook(() => useActiveStep())

    place([-1370, -800, 90, 291])
    scroll()
    expect(result.current).toBe(3)

    place([-1370, -800, 90, 290])
    scroll()
    expect(result.current).toBe(5)
  })

  it('maps the result section to step 5', () => {
    const { result } = renderHook(() => useActiveStep())

    place([-2500, -2000, -1000, 90])
    scroll()

    expect(result.current).toBe(5)
  })

  it('lands on the last section at the bottom of the page even when it is short', () => {
    const { result } = renderHook(() => useActiveStep())

    setDocument(4200, 5000, 800)
    place([-4000, -3500, -2500, 502])
    scroll()

    expect(result.current).toBe(5)
  })

  it('re-evaluates on resize and detaches its listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useActiveStep())

    place([-570, 0, 800, 1900])
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(2)

    unmount()
    place([-1370, -800, 90, 1100])
    window.dispatchEvent(new Event('scroll'))
    expect(result.current).toBe(2)
  })
})
