import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    supportedLngs: ['es', 'en'],
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'rs-lang',
      caches: ['localStorage'],
    },
  })

const syncDocumentLang = (lng: string) => {
  document.documentElement.lang = lng
}

i18n.on('languageChanged', syncDocumentLang)
syncDocumentLang(i18n.resolvedLanguage ?? i18n.language ?? 'es')

export default i18n
