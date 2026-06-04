import { defineConfig, type HeadConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'
import { generateSidebar } from './sidebar'
import { generateOgImage } from './og-image'
import { buildJsonLdHeads } from './json-ld'

const docsDir = new URL('../', import.meta.url).pathname
const siteUrl = 'https://vuewiki.dev'
const ogDescription =
  'Master Vue.js with 170+ interview questions, answers, and interactive code examples. Covers Composition API, reactivity, components, TypeScript, Pinia, Nuxt, SSR, and more.'

export default defineConfig({
  title: 'VueWiki',
  titleTemplate: ':title — VueWiki',
  description: ogDescription,
  cleanUrls: true,
  lastUpdated: true,

  sitemap: {
    hostname: siteUrl
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }]
  ],

  async transformHead({ pageData, siteConfig }) {
    const head: HeadConfig[] = []
    const path = pageData.relativePath.replace(/(index)?\.md$/, '')
    const canonicalUrl = `${siteUrl}/${path}`

    head.push(['link', { rel: 'canonical', href: canonicalUrl }])
    head.push(['meta', { property: 'og:url', content: canonicalUrl }])

    const title = pageData.frontmatter.title || 'VueWiki'
    head.push(['meta', { property: 'og:title', content: title }])
    head.push(['meta', { name: 'twitter:title', content: title }])

    const description = pageData.frontmatter.summary || ogDescription
    head.push(['meta', { property: 'og:description', content: description }])
    head.push(['meta', { name: 'twitter:description', content: description }])

    if (pageData.frontmatter.tags) {
      head.push([
        'meta',
        { name: 'keywords', content: pageData.frontmatter.tags.join(', ') }
      ])
    }

    const isQuestion =
      pageData.relativePath.startsWith('q/') ||
      pageData.relativePath.includes('/q/')
    head.push([
      'meta',
      { property: 'og:type', content: isQuestion ? 'article' : 'website' }
    ])

    if (isQuestion && pageData.frontmatter.difficulty) {
      const slug = pageData.relativePath
        .replace(/\.md$/, '')
        .replaceAll('/', '-')
      const outDir = siteConfig.outDir
      const lang = pageData.relativePath.startsWith('es/') ? 'es' : 'en'
      const filename = await generateOgImage(
        slug,
        pageData.frontmatter.title,
        pageData.frontmatter.difficulty,
        pageData.frontmatter.tags || [],
        outDir,
        lang
      )
      head.push([
        'meta',
        { property: 'og:image', content: `${siteUrl}/${filename}` }
      ])
      head.push([
        'meta',
        { name: 'twitter:image', content: `${siteUrl}/${filename}` }
      ])
    }

    if (pageData.relativePath.startsWith('q/')) {
      const esUrl = `${siteUrl}/es/${path}`
      head.push([
        'link',
        { rel: 'alternate', hreflang: 'en', href: canonicalUrl }
      ])
      head.push(['link', { rel: 'alternate', hreflang: 'es', href: esUrl }])
    } else if (pageData.relativePath.startsWith('es/q/')) {
      const enUrl = `${siteUrl}/${path.replace('es/', '')}`
      head.push([
        'link',
        { rel: 'alternate', hreflang: 'es', href: canonicalUrl }
      ])
      head.push(['link', { rel: 'alternate', hreflang: 'en', href: enUrl }])
    }

    if (isQuestion && pageData.frontmatter.title) {
      head.push(
        ...buildJsonLdHeads({
          title,
          description,
          canonicalUrl,
          relativePath: pageData.relativePath,
          difficulty: pageData.frontmatter.difficulty,
          tags: pageData.frontmatter.tags,
          lastUpdated: pageData.lastUpdated
        })
      )
    }

    return head
  },

  markdown: {
    theme: {
      dark: 'github-dark',
      light: 'github-light'
    }
  },

  vite: {
    plugins: [
      llmstxt({
        description:
          'Vue.js interview questions with answers and code examples',
        details: `
170 questions covering Vue 3, Composition API, reactivity, components, TypeScript,
testing, Nuxt, SSR, performance, architecture, and common interview scenarios.
Available in English and Spanish.
`.trim(),
        ignoreFiles: ['index.md', 'es/index.md']
      })
    ]
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    es: {
      label: 'Español',
      lang: 'es',
      description:
        'Preguntas de entrevista de Vue.js con respuestas y ejemplos',
      themeConfig: {
        returnToTopLabel: 'Volver arriba',
        sidebarMenuLabel: 'Menú',
        darkModeSwitchLabel: 'Apariencia',
        lightModeSwitchTitle: 'Cambiar a tema claro',
        darkModeSwitchTitle: 'Cambiar a tema oscuro',
        outline: {
          label: 'En esta página'
        },
        docFooter: {
          prev: 'Página anterior',
          next: 'Página siguiente'
        },
        lastUpdated: {
          text: 'Última actualización'
        },
        editLink: {
          pattern:
            'https://github.com/miguelfernandezdev/vuewiki.dev/edit/main/docs/:path',
          text: 'Sugerir cambios en esta página'
        },
        footer: {
          message: 'Publicado bajo la licencia MIT.',
          copyright: 'Copyright © 2026-present Miguel Fernández Carratalá'
        },
        nav: [
          { text: 'Preguntas', link: '/es/', activeMatch: '^/es/$' },
          { text: 'Por dificultad', link: '/es/questions' },
          { text: 'Flashcards', link: '/es/flashcards' },
          { text: 'Recursos', link: '/es/resources' },
          {
            text: 'Enlaces',
            items: [
              {
                text: 'Contribuir',
                link: 'https://github.com/miguelfernandezdev/vuewiki.dev/blob/main/CONTRIBUTING.md'
              },
              {
                text: 'Changelog',
                link: 'https://github.com/miguelfernandezdev/vuewiki.dev/commits/main'
              }
            ]
          }
        ],
        notFound: {
          title: 'PÁGINA NO ENCONTRADA',
          quote:
            'Pero si no cambias de dirección y sigues buscando, puede que acabes donde no querías llegar.',
          linkLabel: 'ir al inicio',
          linkText: 'Llévame al inicio',
          code: '404'
        }
      }
    }
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
                buttonAriaLabel: 'Buscar'
              },
              modal: {
                displayDetails: 'Mostrar lista detallada',
                resetButtonTitle: 'Limpiar búsqueda',
                backButtonTitle: 'Cerrar búsqueda',
                noResultsText: 'Sin resultados para',
                footer: {
                  selectText: 'para seleccionar',
                  navigateText: 'para navegar',
                  closeText: 'para cerrar'
                }
              }
            }
          }
        }
      }
    },

    logo: '/logo.svg',

    socialLinks: [
      { icon: 'x', link: 'https://x.com/MiguelFdezDev' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/miguelfernandez.dev' },
      {
        icon: 'github',
        link: 'https://github.com/miguelfernandezdev/vuewiki.dev'
      }
    ],

    editLink: {
      pattern:
        'https://github.com/miguelfernandezdev/vuewiki.dev/edit/main/docs/:path',
      text: 'Suggest changes to this page'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Miguel Fernández Carratalá'
    },

    nav: [
      { text: 'Questions', link: '/', activeMatch: '^/$' },
      { text: 'By Difficulty', link: '/questions' },
      { text: 'Flashcards', link: '/flashcards' },
      { text: 'Resources', link: '/resources' },
      {
        text: 'Links',
        items: [
          {
            text: 'Contributing',
            link: 'https://github.com/miguelfernandezdev/vuewiki.dev/blob/main/CONTRIBUTING.md'
          },
          {
            text: 'Changelog',
            link: 'https://github.com/miguelfernandezdev/vuewiki.dev/commits/main'
          }
        ]
      }
    ],
    sidebar: generateSidebar(docsDir)
  }
})
