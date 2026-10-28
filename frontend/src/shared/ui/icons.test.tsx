import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import * as icons from './icons'

const DESIGN_ICONS = [
  'AlertIcon',
  'ErrorIcon',
  'OkIcon',
  'CheckIcon',
  'RainIcon',
  'SunIcon',
  'TempIcon',
  'ClockIcon',
  'WrenchIcon',
  'RetryIcon',
  'PlusIcon',
  'TrashIcon',
  'FlagIcon',
  'BoltIcon',
  'ServerIcon',
  'UpIcon',
  'DownIcon',
  'ArrowIcon',
  'InfoIcon',
  'CarIcon',
  'FlagEndIcon',
]

const LEGACY_ICONS = ['ArrowLeftIcon', 'DotIcon']

describe('icons', () => {
  it.each([...DESIGN_ICONS, ...LEGACY_ICONS])(
    '%s renders a 1.5px currentColor stroke hidden from assistive tech',
    (name) => {
      const Icon = (icons as unknown as Record<string, (p: icons.IconProps) => React.ReactElement>)[
        name
      ]
      expect(Icon).toBeTypeOf('function')

      const { container } = render(<Icon />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('stroke-width', '1.5')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20')
    },
  )

  it('accepts a size override', () => {
    const { container } = render(<icons.CheckIcon width={16} height={16} />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '16')
  })
})
