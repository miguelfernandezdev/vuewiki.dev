---
order: 155
title: 'How does hybrid rendering (route rules) work in Nuxt?'
difficulty: 'intermediate'
tags: ['nuxt', 'ssr', 'performance']
summary: 'routeRules lets you mix prerender, ISR, SWR, and SPA strategies per route in the same Nuxt app.'
---

Hybrid rendering lets you mix rendering strategies per route in the same Nuxt app. A marketing page can be prerendered at build time, the blog can use ISR, and the admin panel can be client-only. You configure all of this in `routeRules`.

## routeRules in nuxt.config.ts

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { isr: 3600 },
    '/admin/**': { ssr: false },
    '/api/**': { cors: true }
  }
})
```

Each key is a route pattern. Glob patterns (`**`) match nested paths.

## Available rules

| Rule                        | What it does                                                  |
| --------------------------- | ------------------------------------------------------------- |
| `prerender: true`           | Generate static HTML at build time                            |
| `ssr: false`                | Client-side only (SPA for that route)                         |
| `isr: number`               | Incremental Static Regeneration, cache for N seconds          |
| `swr: number \| true`       | Stale-While-Revalidate, serve stale and refresh in background |
| `cache: { maxAge: number }` | Server response cache with TTL                                |
| `redirect: string`          | HTTP redirect                                                 |
| `cors: true`                | Add CORS headers                                              |
| `headers: object`           | Custom response headers                                       |

<img src="/diagrams/en/nuxt-hybrid-rendering.svg" alt="Decision tree for choosing Nuxt hybrid rendering strategy based on SEO needs and content freshness" style="max-width: 100%;" />

## When to use each strategy

**Prerender** for content that changes at deploy time:

```ts
routeRules: {
  '/': { prerender: true },
  '/pricing': { prerender: true },
  '/docs/**': { prerender: true },
}
```

**ISR** for content that changes periodically but doesn't need to be real-time:

```ts
routeRules: {
  '/blog/**': { isr: 3600 },       // rebuild every hour
  '/products/**': { isr: 600 },    // rebuild every 10 minutes
}
```

The first request after the cache expires triggers a background regeneration. Users always get a fast cached response.

**SWR** is similar to ISR but always serves the stale version while revalidating:

```ts
routeRules: {
  '/feed': { swr: true },           // default TTL
  '/leaderboard': { swr: 300 },     // 5-minute window
}
```

**Client-only** for pages behind authentication or with no SEO need:

```ts
routeRules: {
  '/admin/**': { ssr: false },
  '/dashboard/**': { ssr: false },
}
```

## Inline route rules (per page)

Instead of configuring everything in `nuxt.config.ts`, you can define rules directly in the page:

```vue
<!-- pages/about.vue -->
<script setup>
defineRouteRules({
  prerender: true
})
</script>
```

This keeps the rendering strategy next to the page that uses it.

## Combining rules

Rules can stack. A route can have caching, headers, and CORS at the same time:

```ts
routeRules: {
  '/api/public/**': {
    cors: true,
    cache: { maxAge: 60 },
    headers: { 'X-Custom': 'value' }
  }
}
```

## ISR vs SWR vs prerender

|                        | prerender                 | ISR                             | SWR                              |
| ---------------------- | ------------------------- | ------------------------------- | -------------------------------- |
| When HTML is generated | Build time                | First request, then on interval | First request, then on interval  |
| Stale content shown    | Never (until next deploy) | Only while regenerating         | Always (refreshes in background) |
| Needs a server         | No (static files)         | Yes                             | Yes                              |
| Good for               | Landing pages, docs       | Blog posts, product pages       | Feeds, dashboards                |

See also: [What are the rendering modes in Nuxt?](/q/nuxt-rendering-modes) · [How do you deploy a Nuxt app?](/q/nuxt-deployment) · [How does data fetching work in Nuxt?](/q/nuxt-data-fetching)

## References

- [Hybrid Rendering](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering) - Nuxt docs
- [Route Rules](https://nuxt.com/docs/api/nuxt-config#routerules) - Nuxt docs
- [Nitro Route Rules](https://nitro.build/config#routerules) - Nitro docs
