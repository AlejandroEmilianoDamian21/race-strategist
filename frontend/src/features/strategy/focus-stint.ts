const FIELD_INDEX = /^stints\[(\d+)\]/

export function stintIndexOf(field: string | undefined): number | null {
  const match = field === undefined ? null : FIELD_INDEX.exec(field)
  return match === null ? null : Number(match[1])
}

function lapsInput(row: Element): HTMLElement | null {
  return row.querySelector<HTMLElement>('[data-field="laps"]')
}

function compoundButton(row: Element): HTMLElement | null {
  return (
    row.querySelector<HTMLElement>('[data-field="compound"] [aria-checked="true"]') ??
    row.querySelector<HTMLElement>('[data-field="compound"] button')
  )
}

export function focusStint(field: string | undefined): void {
  const index = stintIndexOf(field)
  const row = document.querySelector(`[data-stint="${index ?? 0}"]`)
  if (row === null) {
    document.getElementById('step-strategy')?.scrollIntoView({ behavior: 'smooth' })
    return
  }
  const target = field?.endsWith('.compound') === true ? compoundButton(row) : lapsInput(row)
  row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target?.focus({ preventScroll: true })
}
