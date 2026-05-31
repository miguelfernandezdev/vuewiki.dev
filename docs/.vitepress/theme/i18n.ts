import { useData } from 'vitepress'
import { computed } from 'vue'
import en from './locales/en.json'
import es from './locales/es.json'

const messages: Record<string, Record<string, any>> = { en, es }

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
        value,
      )
    }
    return value
  }

  return { t, lang: computed(() => lang.value) }
}
