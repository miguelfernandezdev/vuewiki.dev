---
order: 132
title: '¿Cómo gestionarías la internacionalización (i18n) en Vue?'
difficulty: 'intermediate'
tags: ['architecture', 'v-model']
summary: 'Usa vue-i18n para apps Vue o @nuxtjs/i18n para Nuxt. Proveen cambio reactivo de idioma, interpolación, pluralización y traducciones lazy.'
---

La solución estándar es `vue-i18n` para apps Vue y `@nuxtjs/i18n` para Nuxt. Proporcionan cambio reactivo de locale, interpolación de mensajes, pluralización, formateo de fechas y números, y traducciones cargadas de forma diferida. Para necesidades más sencillas, puedes construir un sistema i18n ligero con un composable y archivos JSON.

## Configuración de vue-i18n

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

## Usar traducciones en componentes

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

<PlaygroundLink code="<script setup>
import { useI18n } from 'vue-i18n'
&#10;const { t, locale } = useI18n()
</script>
&#10;<template>

  <p>{{ t('greeting', { name: 'Miguel' }) }}</p>
  <p>{{ t('items', 5) }}</p>
&#10;  <nav>
    <a href=&quot;/&quot;>{{ t('nav.home') }}</a>
    <a href=&quot;/about&quot;>{{ t('nav.about') }}</a>
  </nav>
&#10;  <select v-model=&quot;locale&quot;>
    <option value=&quot;en&quot;>English</option>
    <option value=&quot;es&quot;>Español</option>
  </select>
</template>" />

Cambiar `locale` actualiza reactivamente todas las traducciones en la app.

## Pluralización

vue-i18n usa formas separadas por pipe: cero | uno | muchos.

```json
{
  "messages": "No messages | 1 message | {count} messages"
}
```

```vue
<p>{{ t('messages', 0) }}</p>
<!-- No messages -->
<p>{{ t('messages', 1) }}</p>
<!-- 1 message -->
<p>{{ t('messages', 42) }}</p>
<!-- 42 messages -->
```

<PlaygroundLink code="<p>{{ t('messages', 0) }}</p>

<!-- No messages -->
<p>{{ t('messages', 1) }}</p>
<!-- 1 message -->
<p>{{ t('messages', 42) }}</p>
<!-- 42 messages -->" />

## Formateo de fechas y números

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
<p>{{ d(new Date(), 'short') }}</p>
<!-- Jun 1, 2026 / 1 jun 2026 -->
<p>{{ n(99.99, 'currency') }}</p>
<!-- $99.99 / 99,99 € -->
```

<PlaygroundLink code="<p>{{ d(new Date(), 'short') }}</p>

<!-- Jun 1, 2026 / 1 jun 2026 -->
<p>{{ n(99.99, 'currency') }}</p>
<!-- $99.99 / 99,99 € -->" />

## Carga diferida de traducciones

Para apps con muchos locales, carga las traducciones bajo demanda en lugar de incluirlas todas en el bundle:

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

<PlaygroundLink code="<select @change=&quot;loadLocale(($event.target as HTMLSelectElement).value)&quot;>

  <option value=&quot;en&quot;>English</option>
  <option value=&quot;es&quot;>Español</option>
  <option value=&quot;fr&quot;>Français</option>
</select>" />

Solo el locale activo está en el bundle. Los demás se cargan cuando se seleccionan.

## Nuxt i18n

`@nuxtjs/i18n` añade enrutamiento, SEO y soporte SSR sobre vue-i18n:

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

Esto proporciona:

- `/about` para inglés, `/es/about` para español
- `<html lang="es">` configurado automáticamente
- `useLocalePath()` para enlaces que respetan el locale
- Traducciones cargadas de forma diferida por ruta

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

<PlaygroundLink code="<script setup>
const localePath = useLocalePath()
const { locale, setLocale } = useI18n()
</script>
&#10;<template>
  <NuxtLink :to=&quot;localePath('/about')&quot;>{{ $t('nav.about') }}</NuxtLink>
  <button @click=&quot;setLocale('es')&quot;>Español</button>
</template>" />

## Enfoque DIY ligero

Para apps pequeñas que no necesitan pluralización ni formateo, un composable con archivos JSON funciona bien:

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

Es más sencillo, pero carece de pluralización, interpolación, formateo de fechas y el soporte del ecosistema de vue-i18n.

## Cuándo usar cada opción

| Necesidad                                                | Solución                               |
| -------------------------------------------------------- | -------------------------------------- |
| i18n completo con pluralización, formateo y herramientas | vue-i18n                               |
| Nuxt con rutas localizadas y SEO                         | @nuxtjs/i18n                           |
| App pequeña, pocas cadenas, sin reglas de plural         | Composable DIY                         |
| Sitio estático con pocas páginas por idioma              | Archivos markdown separados por locale |

Ver también: [¿Cómo funciona el sistema de plugins de Vue?](/es/q/plugin-system) · [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cómo funciona el routing basado en archivos en Nuxt?](/es/q/nuxt-file-based-routing)

## Referencias

- [vue-i18n](https://vue-i18n.intlify.dev/) - vue-i18n docs
- [@nuxtjs/i18n](https://i18n.nuxtjs.org/) - Nuxt i18n docs
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - MDN
