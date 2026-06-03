import { useData } from 'vitepress'
import { computed } from 'vue'
import en from './locales/en.json'
import es from './locales/es.json'
import zh from './locales/zh.json'
import pt from './locales/pt.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import ru from './locales/ru.json'
import ar from './locales/ar.json'
import vi from './locales/vi.json'
import hi from './locales/hi.json'

const messages: Record<string, Record<string, any>> = {
  en,
  es,
  zh,
  pt,
  ja,
  ko,
  fr,
  de,
  ru,
  ar,
  vi,
  hi
}

export const completedLocales = new Set(['en', 'es'])

export const translationIssues: Record<string, number> = {
  zh: 7,
  pt: 8,
  ja: 9,
  ko: 10,
  fr: 11,
  de: 12,
  ru: 13,
  ar: 14,
  vi: 15,
  hi: 16
}

export function useI18n() {
  const { lang } = useData()

  const t = (key: string, params?: Record<string, string | number>): string => {
    const locale = messages[lang.value] || messages.en
    const keys = key.split('.')
    let value: any = locale
    for (const k of keys) {
      value = value?.[k]
    }
    if (typeof value !== 'string') return key
    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        value
      )
    }
    return value
  }

  return { t, lang: computed(() => lang.value) }
}
