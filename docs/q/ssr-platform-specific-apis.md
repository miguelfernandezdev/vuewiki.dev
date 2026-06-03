---
order: 143
title: "How do you avoid platform-specific API issues in SSR?"
difficulty: "intermediate"
tags: ["ssr", "vite"]
summary: "window, document, and localStorage don't exist on the server. Guard them with onMounted, typeof window checks, or <ClientOnly>."
---

In SSR, your Vue code runs on both the server (Node.js) and the browser. Browser APIs like `window`, `document`, and `localStorage` don't exist on the server and will throw `ReferenceError`. You need to guard platform-specific code so it only runs in the right environment.

## APIs that break on the server

```ts
// ALL of these crash during SSR
const width = ref(window.innerWidth)        // ReferenceError
const theme = localStorage.getItem('theme') // ReferenceError
const ua = navigator.userAgent              // ReferenceError
document.title = 'My Page'                  // ReferenceError
```

| Browser API | Error on server |
|---|---|
| `window` | ReferenceError |
| `document` | ReferenceError |
| `localStorage` / `sessionStorage` | ReferenceError |
| `navigator` | ReferenceError |
| `IntersectionObserver` | ReferenceError |
| `requestAnimationFrame` | ReferenceError |

## Solution 1: move to onMounted

`onMounted` only runs on the client. This is the simplest and most common fix:

```vue
<script setup>
const width = ref(0)
const theme = ref('light')

onMounted(() => {
  width.value = window.innerWidth
  theme.value = localStorage.getItem('theme') || 'light'

  window.addEventListener('resize', () => {
    width.value = window.innerWidth
  })
})
</script>
```

Initialize refs with safe defaults that work on the server, then update them after mount.

## Solution 2: typeof guard

When you need to check outside lifecycle hooks (e.g., in a utility function):

```ts
function getStoredValue(key: string, fallback: string): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) ?? fallback
  }
  return fallback
}
```

## Solution 3: import.meta (Nuxt / Vite)

Nuxt and Vite provide build-time flags that tree-shake dead code:

```vue
<script setup>
if (import.meta.client) {
  window.analytics.track('page_view')
}

if (import.meta.server) {
  console.log('Rendering on server')
}
</script>
```

Code inside `import.meta.server` is removed from the client bundle, and vice versa. This is better than a runtime check because it reduces bundle size.

## Solution 4: ClientOnly component (Nuxt)

Wrap browser-only components so they render only on the client:

```vue
<template>
  <ClientOnly>
    <BrowserChart :data="chartData" />
    <template #fallback>
      <div class="skeleton" />
    </template>
  </ClientOnly>
</template>
```

The `#fallback` slot renders during SSR so the layout doesn't shift when the component loads.

## Solution 5: dynamic import for browser-only libraries

Some third-party libraries access `window` on import. Use `defineAsyncComponent` to defer the import to the client:

```vue
<script setup>
const MapView = defineAsyncComponent(() =>
  import('leaflet-vue').then(m => m.MapView)
)
</script>

<template>
  <ClientOnly>
    <MapView :center="[40, -3]" />
  </ClientOnly>
</template>
```

## SSR-safe composable pattern

When writing composables that use browser APIs, provide server-safe defaults and defer browser work to `onMounted`:

```ts
export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  if (typeof window !== 'undefined') {
    onMounted(() => {
      const update = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
      }
      update()
      window.addEventListener('resize', update)
      onUnmounted(() => window.removeEventListener('resize', update))
    })
  }

  return { width, height }
}
```

This composable works on the server (returns zeros) and updates correctly on the client.

## The other direction: Node.js APIs in the browser

Server-only APIs like `fs`, `path`, and `process` don't exist in the browser. Keep them in `server/` directories or behind `import.meta.server` guards:

```ts
// server/utils/config.ts — only runs on server
import { readFileSync } from 'fs'

export function loadConfig() {
  return JSON.parse(readFileSync('./config.json', 'utf-8'))
}
```

## Lifecycle hooks and SSR

| Hook | Runs on server? | Runs on client? |
|---|---|---|
| `setup()` / `<script setup>` | Yes | Yes |
| `beforeCreate` (Options API) | Yes | Yes |
| `created` (Options API) | Yes | Yes |
| `onServerPrefetch` | Yes | No |
| `onBeforeMount` | No | Yes |
| `onMounted` | No | Yes |
| `onBeforeUpdate` | No | Yes |
| `onUpdated` | No | Yes |
| `onUnmounted` | No | Yes |

`setup` runs everywhere, so that's where browser API access is dangerous. Everything from `onBeforeMount` onward is client-only.

See also: [What is SSR?](/q/what-is-ssr) · [What causes SSR hydration mismatches?](/q/ssr-hydration-mismatch) · [What is hydration?](/q/what-is-hydration)

## References

- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html) - Vue.js docs
- [Client-Only Components](https://nuxt.com/docs/api/components/client-only) - Nuxt docs
