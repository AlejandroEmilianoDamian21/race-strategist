import { Trans, useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { STEP_KEYS, stepSectionId, type StepKey } from './steps'

interface StepperProps {
  activeStep: number
}

function goToStep(key: StepKey) {
  document
    .getElementById(stepSectionId(key))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Stepper({ activeStep }: StepperProps) {
  const { t } = useTranslation()
  const total = STEP_KEYS.length
  const activeName = t(`stepper.steps.${STEP_KEYS[activeStep - 1]}`)
  const compact = t('stepper.compact', {
    current: activeStep,
    total,
    name: activeName,
  })

  return (
    <nav aria-label={t('stepper.label')}>
      <ol className="hidden min-[720px]:flex gap-0.5 list-none m-0 p-0">
        {STEP_KEYS.map((key, index) => {
          const number = index + 1
          const active = number === activeStep
          const done = number < activeStep
          return (
            <li
              key={key}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex-1 min-w-0 border-t-[3px]',
                active && 'border-accent text-ink',
                done && 'border-ink-muted text-ink-muted',
                !active && !done && 'border-surface-3 text-ink-faint',
              )}
            >
              <button
                type="button"
                onClick={() => goToStep(key)}
                className="block w-full cursor-pointer px-3 pt-3 pb-2 text-left font-display text-[14px] font-bold uppercase tracking-[1px] text-inherit focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span className="mr-2 font-mono text-caption">
                  {String(number).padStart(2, '0')}
                </span>
                <span data-step-label className={cn(!active && 'max-[1099px]:sr-only')}>
                  {t(`stepper.steps.${key}`)}
                </span>
                {done && <span className="sr-only"> {t('stepper.done')}</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <div
        role="progressbar"
        aria-label={compact}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={activeStep}
        className="min-[720px]:hidden pb-3 font-display text-label font-bold uppercase tracking-[1px] text-ink-muted"
      >
        <span aria-hidden="true">
          <Trans
            i18nKey="stepper.compactRich"
            values={{ current: activeStep, total, name: activeName }}
            components={{ b: <b className="text-ink" /> }}
          />
        </span>
        <div className="mt-2 h-[3px] bg-surface-3">
          <div className="h-full bg-accent" style={{ width: `${(activeStep / total) * 100}%` }} />
        </div>
      </div>
    </nav>
  )
}
