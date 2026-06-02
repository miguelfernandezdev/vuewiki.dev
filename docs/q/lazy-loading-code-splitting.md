---
order: 30
title: "How would you implement lazy loading and code splitting?"
difficulty: "advanced"
tags: ["performance", "vue-router"]
---

Code splitting breaks your app into smaller JavaScript files (chunks) that load on demand instead of all at once. Lazy loading means loading a chunk only when the user actually needs it — navigating to a route, opening a modal, scrolling to a section. Vite handles this automatically when you use dynamic `import()`.

## Route-level code splitting

The most impactful split. Each route becomes its own chunk, loaded only when the user navigates to it:

```ts
const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
]
```

Each `() => import(...)` tells Vite to create a separate chunk. The browser downloads `/dashboard`'s code only when the user navigates there. This is the default pattern in Vue Router and requires no additional configuration.

## Component-level code splitting

For heavy components within a page that aren't always needed:

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200,
  timeout: 10000
})
</script>

<template>
  <HeavyChart v-if="showChart" />
</template>
```

`delay` prevents showing the loading component for fast loads (avoids a flash). `timeout` shows the error component if loading takes too long.

For simple cases without loading/error states:

```ts
const HeavyChart = defineAsyncComponent(
  () => import('./components/HeavyChart.vue')
)
```

## Conditional lazy loading

Load components only when a condition is met:

```vue
<script setup>
import { defineAsyncComponent, shallowRef } from 'vue'

const AdminPanel = shallowRef(null)

async function loadAdmin() {
  AdminPanel.value = defineAsyncComponent(
    () => import('./components/AdminPanel.vue')
  )
}
</script>

<template>
  <button @click="loadAdmin">Open Admin</button>
  <component :is="AdminPanel" v-if="AdminPanel" />
</template>
```

## Prefetching and preloading

Vite automatically adds `<link rel="modulepreload">` for chunks linked from the entry point. For routes the user is likely to visit next, Vue Router's `<RouterLink>` doesn't prefetch by default, but you can trigger it manually:

```ts
function prefetchRoute(path: string) {
  const route = router.resolve(path)
  const components = route.matched.flatMap(r =>
    Object.values(r.components ?? {})
  )
  components.forEach(c => {
    if (typeof c === 'function') (c as Function)()
  })
}
```

In Nuxt, `<NuxtLink>` prefetches linked routes automatically when they enter the viewport.

## Named chunks

Group related routes into the same chunk with Vite's magic comments:

```ts
const routes = [
  {
    path: '/settings/profile',
    component: () => import(/* webpackChunkName: "settings" */ './views/SettingsProfile.vue')
  },
  {
    path: '/settings/billing',
    component: () => import(/* webpackChunkName: "settings" */ './views/SettingsBilling.vue')
  }
]
```

With Vite (Rollup), use `manualChunks` in the config for more control over chunk grouping.

## What Vite does automatically

| Feature | Automatic? |
| --- | --- |
| Split on dynamic `import()` | Yes |
| Tree-shake unused exports | Yes |
| CSS code splitting (per-component) | Yes |
| `modulepreload` for entry chunks | Yes |
| Vendor chunk separation | Yes (configurable) |

## When to split

| Scenario | Approach |
| --- | --- |
| Different pages/routes | Route-level splitting (always do this) |
| Heavy component behind a toggle | `defineAsyncComponent` |
| Large library used on one page | Dynamic `import()` in the component |
| Admin section most users never visit | Separate route chunk |
| Components always visible on load | Don't split (adds latency) |

The biggest win is route-level splitting — it's the default in Vue Router and costs nothing to implement. Component-level splitting is for specific heavy components where the additional network request is worth the smaller initial bundle.

See also: [What are async components?](/q/async-components) · [How does Vue Router work?](/q/vue-router-navigation-guards) · [What is Vite?](/q/what-is-vite)

## References

- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
- [Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html) - Vue Router docs
- [Code Splitting](https://vite.dev/guide/build.html) - Vite docs
