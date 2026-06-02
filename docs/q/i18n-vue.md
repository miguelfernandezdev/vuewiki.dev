---
order: 132
title: "How would you handle internationalization (i18n) in Vue?"
difficulty: "intermediate"
tags: ["architecture", "v-model"]
---

The standard solution is `vue-i18n` for Vue apps and `@nuxtjs/i18n` for Nuxt. They provide reactive locale switching, message interpolation, pluralization, date/number formatting, and lazy-loaded translations. For simpler needs, you can build a lightweight i18n system with a composable and JSON files.

## vue-i18n setup

```bash
npm install vue-i18n
```

```ts
// i18n/index.ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es }
})
```

```json
// i18n/locales/en.json
{
  "greeting": "Hello, {name}!",
  "items": "No items | One item | {count} items",
  "nav": {
    "home": "Home",
    "about": "About"
  }
}
```

```json
// i18n/locales/es.json
{
  "greeting": "¡Hola, {name}!",
  "items": "Sin elementos | Un elemento | {count} elementos",
  "nav": {
    "home": "Inicio",
    "about": "Acerca de"
  }
}
```

```ts
// main.ts
import { i18n } from './i18n'

const app = createApp(App)
app.use(i18n)
app.mount('#app')
```

## Using translations in components

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
</script>

<template>
  <p>{{ t('greeting', { name: 'Miguel' }) }}</p>
  <p>{{ t('items', 5) }}</p>

  <nav>
    <a href="/">{{ t('nav.home') }}</a>
    <a href="/about">{{ t('nav.about') }}</a>
  </nav>

  <select v-model="locale">
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</template>
```

Changing `locale` reactively switches all translations across the app.

## Pluralization

vue-i18n uses pipe-separated forms: zero | one | many.

```json
{
  "messages": "No messages | 1 message | {count} messages"
}
```

```vue
<p>{{ t('messages', 0) }}</p>  <!-- No messages -->
<p>{{ t('messages', 1) }}</p>  <!-- 1 message -->
<p>{{ t('messages', 42) }}</p> <!-- 42 messages -->
```

## Date and number formatting

```ts
const i18n = createI18n({
  locale: 'en',
  datetimeFormats: {
    en: {
      short: { year: 'numeric', month: 'short', day: 'numeric' }
    },
    es: {
      short: { year: 'numeric', month: 'short', day: 'numeric' }
    }
  },
  numberFormats: {
    en: {
      currency: { style: 'currency', currency: 'USD' }
    },
    es: {
      currency: { style: 'currency', currency: 'EUR' }
    }
  }
})
```

```vue
<p>{{ d(new Date(), 'short') }}</p>   <!-- Jun 1, 2026 / 1 jun 2026 -->
<p>{{ n(99.99, 'currency') }}</p>      <!-- $99.99 / 99,99 € -->
```

## Lazy-loading translations

For apps with many locales, load translations on demand instead of bundling them all:

```ts
async function loadLocale(locale: string) {
  const messages = await import(`./locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  i18n.global.locale.value = locale
}
```

```vue
<select @change="loadLocale(($event.target as HTMLSelectElement).value)">
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="fr">Français</option>
</select>
```

Only the active locale is in the bundle. Others load when selected.

## Nuxt i18n

`@nuxtjs/i18n` adds routing, SEO, and SSR support on top of vue-i18n:

```bash
npx nuxi module add i18n
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'es', file: 'es.json', name: 'Español' }
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales/',
    strategy: 'prefix_except_default'
  }
})
```

This gives you:
- `/about` for English, `/es/about` for Spanish
- `<html lang="es">` set automatically
- `useLocalePath()` for locale-aware links
- Lazy-loaded translations per route

```vue
<script setup>
const localePath = useLocalePath()
const { locale, setLocale } = useI18n()
</script>

<template>
  <NuxtLink :to="localePath('/about')">{{ $t('nav.about') }}</NuxtLink>
  <button @click="setLocale('es')">Español</button>
</template>
```

## Lightweight DIY approach

For small apps that don't need pluralization or formatting, a composable with JSON files works:

```ts
// composables/useI18n.ts
const locale = ref('en')
const messages: Record<string, Record<string, string>> = {}

export function useI18n() {
  function t(key: string): string {
    return messages[locale.value]?.[key] ?? key
  }

  async function setLocale(lang: string) {
    if (!messages[lang]) {
      const mod = await import(`../locales/${lang}.json`)
      messages[lang] = mod.default
    }
    locale.value = lang
  }

  return { t, locale, setLocale }
}
```

This is simpler but lacks pluralization, interpolation, date formatting, and the ecosystem support of vue-i18n.

## When to use what

| Need | Solution |
|---|---|
| Full i18n with pluralization, formatting, tooling | vue-i18n |
| Nuxt with localized routes and SEO | @nuxtjs/i18n |
| Small app, few strings, no plural rules | DIY composable |
| Static site with a few pages per language | Separate markdown files per locale |

See also: [How does the Vue plugin system work?](/q/plugin-system) · [What is a composable?](/q/what-is-a-composable) · [How does Nuxt file-based routing work?](/q/nuxt-file-based-routing)

## References

- [vue-i18n](https://vue-i18n.intlify.dev/) - vue-i18n docs
- [@nuxtjs/i18n](https://i18n.nuxtjs.org/) - Nuxt i18n docs
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - MDN
