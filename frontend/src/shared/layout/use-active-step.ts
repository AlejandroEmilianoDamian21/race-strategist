import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'step-race', step: 1 },
  { id: 'step-info', step: 2 },
  { id: 'step-strategy', step: 3 },
  { id: 'step-result', step: 5 },
]

const HEADER_OFFSET = 90
const READING_LINE_RATIO = 0.25

function atBottomOfPage(): boolean {
  const height = document.documentElement.scrollHeight
  return height > window.innerHeight && window.scrollY + window.innerHeight >= height - 2
}

function currentStep(): number {
  if (atBottomOfPage()) return SECTIONS[SECTIONS.length - 1].step
  const line = HEADER_OFFSET + window.innerHeight * READING_LINE_RATIO
  let step = SECTIONS[0].step
  for (const section of SECTIONS) {
    const element = document.getElementById(section.id)
    if (element !== null && element.getBoundingClientRect().top <= line) step = section.step
  }
  return step
}

export function useActiveStep(): number {
  const [active, setActive] = useState(1)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setActive(currentStep()))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return active
}
