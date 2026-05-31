// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  i18n: {
    locales: [
      { code: 'en', language: 'en', file: 'en.json', name: 'English' },
      { code: 'es', language: 'es', file: 'es.json', name: 'Español' },
    ],
    defaultLocale: 'en',
    restructureDir: 'app',
    langDir: 'locales',
    strategy: 'prefix_except_default',
  },
})
