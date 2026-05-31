import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        order: z.number(),
        title: z.string(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        tags: z.array(z.string()),
      }),
    }),
  },
})
