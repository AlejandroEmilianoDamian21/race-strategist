import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { STEP_KEYS } from '@/shared/layout/steps'

interface SectionHeadProps {
  step: 1 | 2 | 3 | 4 | 5
  title: string
  titleId?: string
  right?: ReactNode
}

export function SectionHead({ step, title, titleId, right }: SectionHeadProps) {
  const { t } = useTranslation()
  const key = STEP_KEYS[step - 1]

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-display text-eyebrow font-bold uppercase tracking-[1.5px] text-ink-muted">
          {t('stepper.eyebrow', {
            number: String(step).padStart(2, '0'),
            name: t(`stepper.steps.${key}`),
          })}
        </p>
        <h2
          id={titleId}
          className="mt-1 font-display text-heading-1 font-extrabold uppercase tracking-[0.5px]"
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}
