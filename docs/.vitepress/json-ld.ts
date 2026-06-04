import type { HeadConfig } from 'vitepress'

const siteUrl = 'https://vuewiki.dev'

interface QuestionMeta {
  title: string
  description: string
  canonicalUrl: string
  relativePath: string
  difficulty?: string
  tags?: string[]
  lastUpdated?: number
}

export function buildJsonLdHeads(meta: QuestionMeta): HeadConfig[] {
  const heads: HeadConfig[] = []
  const isEs = meta.relativePath.startsWith('es/')
  const lang = isEs ? 'es' : 'en'
  const slug = meta.relativePath.replace(/\.md$/, '').replaceAll('/', '-')
  const ogImageUrl = meta.difficulty
    ? `${siteUrl}/og-${slug}.png`
    : `${siteUrl}/og-image.png`

  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: meta.title,
    description: meta.description,
    url: meta.canonicalUrl,
    image: ogImageUrl,
    inLanguage: lang,
    author: {
      '@type': 'Person',
      name: 'Miguel Fernández Carratalá',
      url: 'https://miguelfernandez.dev'
    },
    publisher: {
      '@type': 'Organization',
      name: 'VueWiki',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.svg` }
    },
    keywords: (meta.tags || []).join(', '),
    proficiencyLevel: meta.difficulty
  }
  if (meta.lastUpdated) {
    article.dateModified = new Date(meta.lastUpdated).toISOString()
  }

  const homeName = isEs ? 'Inicio' : 'Home'
  const homeUrl = isEs ? `${siteUrl}/es/` : `${siteUrl}/`
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeName, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: meta.title }
    ]
  }

  heads.push([
    'script',
    { type: 'application/ld+json' },
    JSON.stringify(article)
  ])
  heads.push([
    'script',
    { type: 'application/ld+json' },
    JSON.stringify(breadcrumb)
  ])

  return heads
}
