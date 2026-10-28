import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="h-1 bg-accent" />
      <header className="px-6 py-8">
        <h1 className="font-display text-heading-1 font-extrabold uppercase">{t('app.title')}</h1>
        <p className="text-body text-ink-muted">{t('app.tagline')}</p>
      </header>
    </div>
  )
}

export default App
