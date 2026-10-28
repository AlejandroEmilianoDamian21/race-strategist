import type { ReactNode, Ref } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { STEP_KEYS } from '@/shared/layout/steps'

interface SectionHeadProps {
  step: 1 | 2 | 3 | 4 | 5
  title: string
  titleId?: string
  titleRef?: Ref<HTMLHeadingElement>
  right?: ReactNode
}

export function SectionHead({ step, title, titleId, titleRef, right }: SectionHeadProps) {
  const { t } = useTranslation()
  const key = STEP_KEYS[step - 1]

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-ink-muted">
          <Trans
            i18nKey="stepper.eyebrowRich"
            values={{ number: String(step).padStart(2, '0'), name: t(`stepper.steps.${key}`) }}
            components={{ b: <b className="font-bold text-accent-text" /> }}
          />
        </p>
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={titleRef === undefined ? undefined : -1}
          className="mt-1 heading-1 max-[720px]:text-[26px] max-[720px]:leading-[30px]"
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}
