import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { CheckIcon } from '@/shared/ui/icons'
import { STEP_KEYS } from './steps'

interface StepperProps {
  activeStep: number
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
                'flex-1 min-w-0 truncate border-t-[3px] pt-3 pb-2 px-3',
                'font-display text-[14px] font-bold uppercase tracking-wider',
                active && 'border-accent text-ink',
                done && 'border-ink-muted text-ink-muted',
                !active && !done && 'border-surface-3 text-ink-faint',
              )}
            >
              <span className="mr-2 font-mono text-caption">{String(number).padStart(2, '0')}</span>
              {t(`stepper.steps.${key}`)}
              {done && (
                <>
                  <CheckIcon className="ml-2 inline size-3.5 align-[-1px]" />
                  <span className="sr-only">{t('stepper.done')}</span>
                </>
              )}
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
        className="min-[720px]:hidden pb-3 font-display text-label font-bold uppercase tracking-wider text-ink-muted"
      >
        <span aria-hidden="true">{compact}</span>
        <div className="mt-2 h-[3px] bg-surface-3">
          <div className="h-full bg-accent" style={{ width: `${(activeStep / total) * 100}%` }} />
        </div>
      </div>
    </nav>
  )
}
