import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'
import { Stepper } from './stepper'

interface AppShellProps {
  activeStep: number
  children: ReactNode
}

export function AppShell({ activeStep, children }: AppShellProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="h-1 bg-accent" />
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="mx-auto grid max-w-[1232px] grid-cols-[1fr_auto] items-end gap-x-4 px-4 pt-3 min-[720px]:grid-cols-[auto_1fr_auto] min-[720px]:gap-x-8">
          <h1 className="flex items-center gap-2 pb-2 font-display text-[20px] font-extrabold uppercase leading-7 tracking-[0.5px] whitespace-nowrap min-[720px]:pb-3 min-[720px]:text-[24px]">
            <span
              aria-hidden="true"
              className="h-4 w-[26px] bg-accent [clip-path:polygon(30%_0,100%_0,70%_100%,0_100%)]"
            />
            {t('app.title')}
          </h1>
          <div className="order-last col-span-2 min-[720px]:order-none min-[720px]:col-span-1">
            <Stepper activeStep={activeStep} />
          </div>
          <div className="pb-2 min-[720px]:pb-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1232px] px-4 pt-8 pb-16">{children}</main>
    </div>
  )
}
