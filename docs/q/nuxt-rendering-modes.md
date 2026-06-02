---
order: 146
title: "What is Nuxt and what rendering modes does it support?"
difficulty: "beginner"
tags: ["nuxt"]
---

Nuxt is a full-stack framework built on top of Vue. It adds server-side rendering, file-based routing, auto-imports, data fetching utilities, and a server engine (Nitro) out of the box. Its main differentiator is that you can choose how each page is rendered: on the server, on the client, at build time, or a mix of all three.

## Universal rendering (SSR, default)

The server executes your Vue code, generates HTML, and sends it to the browser. Then JavaScript loads and hydrates the page to make it interactive.

```ts
// nuxt.config.ts — this is the default
export default defineNuxtConfig({
  ssr: true
})
```

The browser shows content immediately (good for SEO and perceived performance), then Vue takes over for interactivity.

## Client-side rendering (SPA)

The server sends an empty HTML shell, and Vue renders everything in the browser.

```ts
export default defineNuxtConfig({
  ssr: false
})
```

Simpler to develop (no SSR constraints), cheaper to host (static files), but no content in the initial HTML. Use it for dashboards, admin panels, and apps behind authentication where SEO doesn't matter.

## Static generation (SSG)

Pre-render pages to HTML at build time. The result is a set of static files you can deploy anywhere.

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { prerender: true }
  }
})
```

Or generate the entire site with `nuxt generate`.

## Hybrid rendering (the real power)

Mix rendering modes per route using `routeRules`. Each route can have its own strategy:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 },
    '/admin/**': { ssr: false },
    '/api/**': { cors: true }
  }
})
```

| Rule | What it does |
|---|---|
| `prerender: true` | Generate static HTML at build time |
| `ssr: false` | Client-side only (SPA) |
| `isr: 3600` | Incremental Static Regeneration, regenerate after 1 hour |
| `swr: true` | Stale-While-Revalidate, serve cached and regenerate in background |
| `cache: { maxAge: 600 }` | Cache the server response for 10 minutes |

You can also define route rules inline in a page:

```vue
<script setup>
defineRouteRules({ prerender: true })
</script>
```

## Client-only content

When parts of a page can't run on the server (browser APIs, third-party widgets):

```vue
<template>
  <ClientOnly>
    <BrowserOnlyChart />
    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </ClientOnly>
</template>
```

In script, use `import.meta.server` and `import.meta.client` to branch logic:

```ts
if (import.meta.client) {
  window.addEventListener('resize', handleResize)
}
```

## When to use which mode

| Scenario | Rendering mode |
|---|---|
| Marketing site, blog, docs | SSG (`prerender: true`) |
| E-commerce with changing prices | ISR or SWR |
| Dashboard behind login | SPA (`ssr: false`) |
| SEO-critical dynamic pages | SSR (default) |
| Mix of all the above | Hybrid with `routeRules` |

See also: [How does hybrid rendering work in Nuxt?](/q/nuxt-hybrid-rendering) · [How do you deploy a Nuxt app?](/q/nuxt-deployment) · [How does data fetching work in Nuxt?](/q/nuxt-data-fetching)

## References

- [Rendering](https://nuxt.com/docs/getting-started/rendering) - Nuxt docs
- [Route Rules](https://nuxt.com/docs/api/nuxt-config#routerules) - Nuxt docs
- [Prerendering](https://nuxt.com/docs/getting-started/prerendering) - Nuxt docs
