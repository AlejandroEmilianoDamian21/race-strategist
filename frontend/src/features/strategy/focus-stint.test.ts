import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusStint, stintIndexOf } from './focus-stint'

function mountRows() {
  document.body.innerHTML = `
    <section id="step-strategy">
      <ul>
        <li data-stint="0"><div role="radiogroup" data-field="compound"><button role="radio" aria-checked="false"></button><button role="radio" aria-checked="true" id="c0"></button></div><input id="l0" data-field="laps" /></li>
        <li data-stint="1"><div role="radiogroup" data-field="compound"><button role="radio" aria-checked="true" id="c1"></button></div><input id="l1" data-field="laps" /></li>
      </ul>
    </section>`
  Element.prototype.scrollIntoView = vi.fn()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('stintIndexOf', () => {
  it('reads the stint index from the field', () => {
    expect(stintIndexOf('stints[2].laps')).toBe(2)
    expect(stintIndexOf('stints[0].compound')).toBe(0)
    expect(stintIndexOf('stints')).toBeNull()
    expect(stintIndexOf(undefined)).toBeNull()
  })
})

describe('focusStint', () => {
  it('focuses the laps input of the stint named by the field', () => {
    mountRows()
    focusStint('stints[1].laps')
    expect(document.activeElement?.id).toBe('l1')
  })

  it('focuses the chosen compound for a compound field', () => {
    mountRows()
    focusStint('stints[0].compound')
    expect(document.activeElement?.id).toBe('c0')
  })

  it('falls back to the first stint for a general field', () => {
    mountRows()
    focusStint('stints')
    expect(document.activeElement?.id).toBe('l0')
  })

  it('scrolls to the strategy section when there are no rows', () => {
    document.body.innerHTML = '<section id="step-strategy"></section>'
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    focusStint('stints[3].laps')
    expect(scroll).toHaveBeenCalled()
  })
})
