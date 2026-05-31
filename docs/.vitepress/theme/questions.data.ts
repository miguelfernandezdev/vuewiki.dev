import { createContentLoader } from 'vitepress'

export interface QuestionData {
  title: string
  order: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  url: string
  locale: string
}

export default createContentLoader('{,es/}q/*.md', {
  transform(rawData): QuestionData[] {
    return rawData
      .map((page) => ({
        title: page.frontmatter.title as string,
        order: page.frontmatter.order as number,
        difficulty: page.frontmatter.difficulty as string,
        tags: (page.frontmatter.tags || []) as string[],
        url: page.url,
        locale: page.url.startsWith('/es/') ? 'es' : 'en',
      }))
      .sort((a, b) => a.order - b.order) as QuestionData[]
  },
})
