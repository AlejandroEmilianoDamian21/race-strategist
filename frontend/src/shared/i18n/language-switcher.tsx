import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

const LANGUAGES = ['es', 'en'] as const

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex border border-line-strong rounded-sm overflow-hidden"
    >
      {LANGUAGES.map((code) => {
        const pressed = i18n.resolvedLanguage === code
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={pressed}
            onClick={() => void i18n.changeLanguage(code)}
            className={cn(
              'h-8 min-w-10 px-2 cursor-pointer font-display text-label font-bold tracking-wider uppercase',
              'focus-visible:outline-none focus-visible:shadow-focus',
              pressed ? 'bg-surface-3 text-ink' : 'bg-transparent text-ink-muted hover:text-ink',
            )}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
