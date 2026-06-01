import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'
import { generateSidebar } from './sidebar'

const docsDir = new URL('../', import.meta.url).pathname
const siteUrl = 'https://vuewiki.dev'
const ogDescription = 'Vue.js interview questions with answers and examples'

export default defineConfig({
  title: 'VueWiki',
  description: ogDescription,
  cleanUrls: true,
  lastUpdated: true,

  sitemap: {
    hostname: siteUrl,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'VueWiki' }],
    ['meta', { property: 'og:description', content: ogDescription }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'VueWiki' }],
    ['meta', { name: 'twitter:description', content: ogDescription }],
  ],

  markdown: {
    theme: {
      dark: 'github-dark',
      light: 'github-light',
    },
  },

  vite: {
    plugins: [
      llmstxt({
        description: 'Vue.js interview questions with answers and code examples',
        details: `
170 questions covering Vue 3, Composition API, reactivity, components, TypeScript,
testing, Nuxt, SSR, performance, architecture, and common interview scenarios.
Available in English and Spanish.
`.trim(),
        ignoreFiles: ['index.md', 'es/index.md'],
      }),
    ],
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    es: {
      label: 'Español',
      lang: 'es',
      description: 'Preguntas de entrevista de Vue.js con respuestas y ejemplos',
      themeConfig: {
        returnToTopLabel: 'Volver arriba',
        sidebarMenuLabel: 'Menú',
        darkModeSwitchLabel: 'Apariencia',
        lightModeSwitchTitle: 'Cambiar a tema claro',
        darkModeSwitchTitle: 'Cambiar a tema oscuro',
        outline: {
          label: 'En esta página',
        },
        docFooter: {
          prev: 'Página anterior',
          next: 'Página siguiente',
        },
        lastUpdated: {
          text: 'Última actualización',
        },
        editLink: {
          pattern: 'https://github.com/miguelfernandezdev/vuewiki.dev/edit/main/docs/:path',
          text: 'Sugerir cambios en esta página',
        },
        footer: {
          message: 'Publicado bajo la licencia MIT.',
          copyright: 'Copyright © 2026-present Miguel Fernández',
        },
        nav: [
          { text: 'Preguntas', link: '/es/', activeMatch: '^/es/' },
          {
            text: 'Enlaces',
            items: [
              { text: 'Contribuir', link: 'https://github.com/miguelfernandezdev/vuewiki.dev/blob/main/CONTRIBUTING.md' },
              { text: 'Changelog', link: 'https://github.com/miguelfernandezdev/vuewiki.dev/commits/main' },
            ],
          },
        ],
        notFound: {
          title: 'PÁGINA NO ENCONTRADA',
          quote: 'Pero si no cambias de dirección y sigues buscando, puede que acabes donde no querías llegar.',
          linkLabel: 'ir al inicio',
          linkText: 'Llévame al inicio',
          code: '404',
        },
      },
    },
  },

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        locales: {
          es: {
            translations: {
              button: {
                buttonText: 'Buscar',
                buttonAriaLabel: 'Buscar',
              },
              modal: {
                displayDetails: 'Mostrar lista detallada',
                resetButtonTitle: 'Limpiar búsqueda',
                backButtonTitle: 'Cerrar búsqueda',
                noResultsText: 'Sin resultados para',
                footer: {
                  selectText: 'para seleccionar',
                  navigateText: 'para navegar',
                  closeText: 'para cerrar',
                },
              },
            },
          },
        },
      },
    },

    logo: '/logo.svg',

    socialLinks: [
      { icon: 'x', link: 'https://x.com/MiguelFdezDev' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/miguelfernandez.dev' },
      { icon: 'github', link: 'https://github.com/miguelfernandezdev/vuewiki.dev' },
    ],

    editLink: {
      pattern: 'https://github.com/miguelfernandezdev/vuewiki.dev/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Miguel Fernández',
    },

    nav: [
      { text: 'Questions', link: '/', activeMatch: '^/$' },
      {
        text: 'Links',
        items: [
          { text: 'Contributing', link: 'https://github.com/miguelfernandezdev/vuewiki.dev/blob/main/CONTRIBUTING.md' },
          { text: 'Changelog', link: 'https://github.com/miguelfernandezdev/vuewiki.dev/commits/main' },
        ],
      },
    ],
    sidebar: generateSidebar(docsDir),
  },
})
