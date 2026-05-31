import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VueWiki.dev',
  description: 'Vue.js interview questions with answers and examples',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    es: {
      label: 'Español',
      lang: 'es',
      description: 'Preguntas de entrevista de Vue.js con respuestas y ejemplos',
    },
  },
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/miguelfernandezdev/vuewiki.dev' },
    ],
    nav: [],
    sidebar: {},
  },
})
