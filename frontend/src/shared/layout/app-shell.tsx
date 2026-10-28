import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'
import { MobileCtaHostContext } from './mobile-cta-host'
import { Stepper } from './stepper'
import { useActiveStep } from './use-active-step'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const activeStep = useActiveStep()
  const [ctaHost, setCtaHost] = useState<HTMLElement | null>(null)

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="h-1 bg-accent" />
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="mx-auto grid max-w-[1232px] grid-cols-[1fr_auto] items-end gap-x-4 px-4 pt-3 min-[721px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[721px]:gap-x-8">
          <h1 className="flex items-center gap-2 pb-2 font-display text-[20px] font-extrabold uppercase leading-7 tracking-[0.5px] whitespace-nowrap min-[721px]:pb-3 min-[721px]:text-[24px]">
            <span
              aria-hidden="true"
              className="h-4 w-[26px] bg-accent [clip-path:polygon(30%_0,100%_0,70%_100%,0_100%)]"
            />
            {t('app.title')}
          </h1>
          <div className="order-last col-span-2 min-[721px]:order-none min-[721px]:col-span-1">
            <Stepper activeStep={activeStep} />
          </div>
          <div className="self-start min-[721px]:self-auto min-[721px]:pb-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <MobileCtaHostContext.Provider value={ctaHost}>
        <main className="mx-auto max-w-[1232px] px-4 pt-8 pb-16">{children}</main>
      </MobileCtaHostContext.Provider>
      <div
        ref={setCtaHost}
        className="sticky bottom-0 z-[9] hidden items-center gap-3 border-t border-line bg-bg px-4 py-3 empty:invisible max-[720px]:flex"
      />
    </div>
  )
}
