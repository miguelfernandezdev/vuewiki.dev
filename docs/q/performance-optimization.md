---
order: 122
title: 'How would you optimize performance in a Vue app?'
difficulty: 'advanced'
tags: ['performance', 'vite', 'watchers', 'slots']
summary: 'Measure first, then fix: lazy loading, v-once/v-memo, shallowRef for large data, virtual lists, code splitting. Never optimize without profiling.'
---

Performance optimization is not a list of tricks to apply upfront. It is a cycle: **measure → identify the bottleneck → fix it → measure again**. Use Vue DevTools, the browser Performance tab, and Lighthouse to find where time is actually going before changing any code.

## Rendering optimizations

Vue's reactivity system is efficient by design, but it cannot know which parts of your component tree are truly dynamic and which are not. These directives and APIs give the compiler and runtime hints to skip unnecessary work.

### `v-once` for static content

`v-once` renders the element or component exactly once and then completely removes it from Vue's reactivity tracking. The virtual DOM will never diff it again. Use it for content that is genuinely static for the lifetime of the page: legal footers, about-page copy, icon sprites.

```vue
<template>
  <!-- Rendered once, never diffed again -->
  <footer v-once>
    <p>© 2024 Acme Corp. All rights reserved.</p>
  </footer>
</template>
```

### `v-memo` for list items that rarely change

`v-memo` accepts a dependency array, the same way `useMemo` works in React. Vue skips re-rendering the subtree when every value in that array is the same as last render. This is particularly useful inside `v-for` loops where only a small fraction of items change on each update.

```vue
<script setup lang="ts">
interface Item {
  id: number
  label: string
}

defineProps<{
  items: Item[]
  selectedId: number
}>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" v-memo="[item.id === selectedId]">
      {{ item.label }}
    </li>
  </ul>
</template>
```

With 1,000 items in the list, selecting a different row causes Vue to re-render only the two rows whose `v-memo` value changed, not all 1,000.

### `shallowRef` and `shallowReactive` for large objects

By default, `ref()` and `reactive()` make every nested property reactive. For a configuration object with hundreds of keys, or a read-heavy data structure you receive from an API and never mutate deeply, this is wasteful because Vue walks the entire object at initialization to attach tracking. `shallowRef` and `shallowReactive` make only the top level reactive, which is enough when you replace the object wholesale rather than mutating nested properties.

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

interface Config {
  theme: string
  locale: string
  featureFlags: Record<string, boolean>
  // ... potentially hundreds more keys
}

const config = shallowRef<Config>({
  theme: 'dark',
  locale: 'en',
  featureFlags: {}
})

function updateConfig(next: Config) {
  // Replacing the top-level ref triggers reactivity correctly
  config.value = next
}
</script>
```

### `computed` caching vs calling a method repeatedly

A `computed` property is cached: Vue evaluates the function once and returns the cached result on every subsequent access until one of its reactive dependencies changes. A method call has no cache; it runs on every render. If you have an expensive filter or sort operation that does not need to run on every keystroke, make it a `computed`, not a method.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref<string[]>(['banana', 'apple', 'cherry'])

// Runs once, cached until `items` changes
const sortedItems = computed(() => [...items.value].sort())

// Runs on every render — no caching
function getSortedItems() {
  return [...items.value].sort()
}
</script>
```

## Loading optimizations

Rendering performance only matters once the app is in the browser. Getting it there faster by shipping less JavaScript on the critical path is often where the biggest wins come from.

### Route-level code splitting

Every route that is not the entry route can be lazy-loaded. Vite (and webpack) split these into separate chunks that are only fetched when the user navigates to that route. The syntax is a dynamic import returning a component.

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/dashboard',
      // This chunk is only fetched when the user navigates to /dashboard
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
```

### `defineAsyncComponent` for heavy components

You can apply the same lazy-loading pattern to individual components, not just routes. A rich text editor, a PDF viewer, or a chart library may add hundreds of KB to your bundle. `defineAsyncComponent` defers loading until the component is actually rendered.

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const RichTextEditor = defineAsyncComponent(
  () => import('@/components/RichTextEditor.vue')
)

const ChartWidget = defineAsyncComponent({
  loader: () => import('@/components/ChartWidget.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // Show loading spinner only after 200ms
  timeout: 5000
})
</script>

<template>
  <RichTextEditor v-if="isEditing" />
  <ChartWidget />
</template>
```

### Lazy hydration in Nuxt

In Nuxt, prefixing a component with `Lazy` defers its JavaScript until the component enters the viewport (or is needed). The component is still server-rendered as HTML, but the client-side hydration (which is what makes it interactive) is delayed. This directly improves Time to Interactive on content-heavy pages.

```vue
<template>
  <!-- Hydrated immediately -->
  <HeroSection />

  <!-- Hydration deferred until the component is needed -->
  <LazyCommentSection />
  <LazyRecommendedArticles />
</template>
```

## List performance

Long lists are one of the most predictable performance problems in frontend apps. If you render 1,000 `<li>` elements in the DOM, the browser has to lay out and paint all 1,000, even the ones that are off-screen. Virtual scrolling fixes this by rendering only the rows visible in the viewport at any given time (typically 20–50 items), recycling DOM nodes as the user scrolls.

For Vue, [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) and [@tanstack/virtual](https://tanstack.com/virtual/latest) are the two common choices. The principle is the same: you pass the full data array, the library calculates which slice is visible, and only those items exist in the DOM.

```vue
<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

interface User {
  id: number
  name: string
  email: string
}

defineProps<{ users: User[] }>()
</script>

<template>
  <RecycleScroller
    :items="users"
    :item-size="56"
    key-field="id"
    v-slot="{ item }"
  >
    <UserRow :user="item" />
  </RecycleScroller>
</template>
```

**Props stability** is a related pattern. When you pass computed values into a list item that change on every parent re-render, every item re-renders too, even when its own data did not change. Prefer passing the derived boolean directly:

```vue
<!-- Unstable: `activeId` prop changes cause all items to re-render -->
<UserRow
  v-for="user in users"
  :key="user.id"
  :user="user"
  :active-id="activeId"
/>

<!-- Stable: only the item whose `active` value changes re-renders -->
<UserRow
  v-for="user in users"
  :key="user.id"
  :user="user"
  :active="user.id === activeId"
/>
```

## Reactivity performance

Vue's reactivity system has a cost proportional to how many reactive dependencies you create and how often they change. A few guidelines:

**Prefer `computed` over `watch`.** A `watch` runs side effects and is harder for Vue to optimize. A `computed` is a pure derived value that is only recalculated when its inputs change. Most data transformations belong in a `computed`.

**Do not make everything reactive.** Data that you only read and never mutate (lookup tables, enum maps, static translations) does not need to be reactive at all. Declare it as a plain `const`, or freeze it with `Object.freeze` to signal that intent and prevent accidental deep observation.

```ts
// No reactivity overhead — Vue won't try to observe this
const STATUS_LABELS = Object.freeze({
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected'
} as const)
```

**Avoid deep watchers on large objects.** `watch(bigObject, handler, { deep: true })` walks the entire object on every change to check for mutations. If you need to react to a nested field, watch only that field: `watch(() => bigObject.value.nestedField, handler)`.

## Measuring tools

No optimization effort is complete without measurement. These are the tools you should reach for first:

| Tool                         | What it shows                            |
| ---------------------------- | ---------------------------------------- |
| Vue DevTools Performance tab | Component render times, re-render counts |
| Browser Performance tab      | Flame chart, long tasks, layout shifts   |
| Lighthouse                   | Core Web Vitals scores                   |
| vite-bundle-visualizer       | Bundle composition and sizes             |
| Network tab                  | Redundant requests, large payloads       |

The Vue DevTools Performance tab is the most useful starting point for runtime problems. It shows you which component is re-rendering, how often, and for how long. The Browser Performance tab goes deeper into the main thread, showing JavaScript execution alongside layout and paint. Lighthouse gives you a summary score and specific CWV metrics (LCP, CLS, INP) that reflect what real users experience. `vite-bundle-visualizer` (`npx vite-bundle-visualizer`) visualizes your output chunks as a treemap, which makes it obvious when a single dependency is dominating your bundle.

## Common mistakes

- **Optimizing before measuring.** Premature optimization is not just wasteful. It can make code worse for no real gain.
- **Making everything reactive.** Static data, constants, and lookup maps do not need to go inside `ref` or `reactive`.
- **Not code-splitting routes.** A single synchronous import graph for the entire app means the user downloads all of it before anything renders.
- **Deep watching large objects.** `{ deep: true }` on a complex object traverses every key on every change. Use a targeted getter instead.
- **Ignoring props stability in lists.** Passing unstable derived values as props causes entire lists to re-render when only one item changed.

---

See also: [How would you diagnose a slow page?](/q/diagnose-slow-page) · [What is v-once and v-memo?](/q/v-once-v-memo) · [How would you virtualize a list?](/q/list-virtualization) · [How do props stability optimizations work?](/q/perf-props-stability)

## References

- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome docs
