---
order: 158
title: 'What are the differences between Nuxt 2 and Nuxt 3?'
difficulty: 'intermediate'
tags: ['nuxt', 'migration', 'pinia', 'vite', 'vueuse', 'vuex']
summary: 'Nuxt 3 rewrites everything on Vue 3, Vite, and Nitro. New APIs for data fetching (useFetch), state (useState), and TypeScript-first DX.'
---

Nuxt 3 is a full rewrite on top of Vue 3, Vite, and the Nitro server engine. The changes go beyond the Vue 2 to Vue 3 shift: the build tool, server layer, data fetching, state management, module system, and TypeScript experience are all different. The core philosophy is the same (convention over configuration, file-based routing, SSR by default), but almost every API surface changed.

## Side-by-side comparison

| Aspect           | Nuxt 2                              | Nuxt 3                                              |
| ---------------- | ----------------------------------- | --------------------------------------------------- |
| Vue version      | Vue 2 (Options API)                 | Vue 3 (Composition API)                             |
| Build tool       | Webpack                             | Vite (default), Webpack optional                    |
| Server engine    | Connect                             | Nitro (built on h3)                                 |
| State management | Vuex                                | Pinia / `useState`                                  |
| Config file      | `nuxt.config.js`                    | `nuxt.config.ts`                                    |
| Auto-imports     | Components only (partial)           | Components, composables, utils, server utils        |
| TypeScript       | Opt-in, painful setup               | First-class, zero config                            |
| Module authoring | Nuxt 2 hooks                        | `@nuxt/kit` API                                     |
| Data fetching    | `asyncData` / `fetch` (Options API) | `useFetch` / `useAsyncData` (Composition API)       |
| Middleware       | `context` object                    | Composables + `navigateTo`                          |
| Plugins          | `inject` + `context`                | `defineNuxtPlugin` + `nuxtApp`                      |
| Rendering        | SSR or static                       | SSR, static, hybrid (per-route rules)               |
| Deployment       | Node.js mainly                      | Universal (Node, Vercel, Netlify, Cloudflare, Deno) |

## Data fetching

The biggest API change. Nuxt 2 used component options (`asyncData`, `fetch`) that received a `context` object. Nuxt 3 uses composables in `<script setup>`:

```ts
// Nuxt 2: asyncData receives context
export default {
  async asyncData({ $axios, params }) {
    const user = await $axios.$get(`/users/${params.id}`)
    return { user }
  }
}
```

```vue
<!-- Nuxt 3: composable in script setup -->
<script setup>
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

`useFetch` handles caching, deduplication, SSR payload transfer, and request cancellation automatically. In Nuxt 2, you managed all of that manually.

## Server engine: Nitro

Nuxt 2 used Connect (the same server behind Express). Nuxt 3 uses Nitro, a standalone server engine built on h3:

```
server/
  api/          → /api/* endpoints
  routes/       → custom server routes
  middleware/   → server middleware (runs on every request)
  plugins/      → Nitro lifecycle hooks
  utils/        → auto-imported server utilities
```

Nitro compiles your server to a self-contained output that runs on any platform. The same codebase deploys to Node.js, Vercel serverless, Cloudflare Workers, or Netlify Edge without changing your code.

## Middleware

```ts
// Nuxt 2: context-based middleware
export default function ({ store, redirect }) {
  if (!store.state.auth.loggedIn) {
    redirect('/login')
  }
}
```

```ts
// Nuxt 3: composable-based middleware
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

Nuxt 3 also distinguishes between route middleware (runs on navigation, lives in `middleware/`) and server middleware (runs on every HTTP request, lives in `server/middleware/`).

## State management

```ts
// Nuxt 2: Vuex store with mutations
export const state = () => ({ count: 0 })
export const mutations = {
  INCREMENT(state) {
    state.count++
  }
}
export const actions = {
  increment({ commit }) {
    commit('INCREMENT')
  }
}
```

```ts
// Nuxt 3: Pinia store (or useState for simple cases)
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() {
    count.value++
  }
  return { count, increment }
})

// Or for simple shared state without Pinia:
const count = useState('count', () => 0)
```

Mutations are gone. Actions directly modify state. `useState` is SSR-safe (unlike a plain `ref` at module scope, which leaks between requests).

## Auto-imports

Nuxt 2 auto-imported components from the `components/` directory but nothing else. Nuxt 3 auto-imports everything:

- Vue APIs (`ref`, `computed`, `watch`, `onMounted`)
- Nuxt composables (`useFetch`, `useRoute`, `useState`, `navigateTo`)
- Your composables from `composables/`
- Your utils from `utils/`
- Server utils from `server/utils/`
- Components from `components/`

No manual imports needed. TypeScript still provides full type checking and autocomplete through generated `.nuxt/imports.d.ts`.

## TypeScript

Nuxt 2 supported TypeScript through `@nuxt/typescript-build`, which required extra configuration and had incomplete type coverage. Nuxt 3 is TypeScript-first:

```ts
// nuxt.config.ts — TypeScript config out of the box
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    apiSecret: '',
    public: {
      apiBase: ''
    }
  }
})
```

Types are auto-generated for routes, middleware, plugins, components, and composables. No setup required.

## Hybrid rendering

Nuxt 2 was either full SSR or full static (`nuxt generate`). Nuxt 3 supports per-route rendering rules:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/blog/**': { isr: 3600 },
    '/api/**': { cors: true }
  }
})
```

Different pages in the same app can use SSR, SSG, ISR, or client-only rendering. Nuxt 2 couldn't do this.

## Module authoring

```ts
// Nuxt 2: module with hooks
export default function MyModule() {
  this.nuxt.hook('build:before', () => {
    /* ... */
  })
  this.addPlugin({ src: resolve(__dirname, 'plugin.js') })
}
```

```ts
// Nuxt 3: @nuxt/kit API
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'my-module' },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve('./runtime/plugin'))
  }
})
```

`@nuxt/kit` provides typed helpers (`addPlugin`, `addComponent`, `addImports`, `addServerHandler`) that replace the ad-hoc `this.addX` methods from Nuxt 2.

See also: [What are the friction points migrating from Nuxt 2 to Nuxt 3?](/q/nuxt2-to-nuxt3-friction) · [How do auto-imports work in Nuxt?](/q/nuxt-auto-imports) · [What are the rendering modes in Nuxt?](/q/nuxt-rendering-modes)

## References

- [Nuxt 2 to Nuxt 3 Migration](https://nuxt.com/docs/migration/overview) - Nuxt docs
- [Introduction](https://nuxt.com/docs/getting-started/introduction) - Nuxt 3 docs
- [Module Author Guide](https://nuxt.com/docs/guide/going-further/modules) - Nuxt docs
