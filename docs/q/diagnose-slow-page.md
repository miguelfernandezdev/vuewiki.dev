---
order: 129
title: 'A page takes 3-4 seconds to become interactive. How do you diagnose and fix it?'
difficulty: 'advanced'
tags: ['performance', 'debugging', 'watchers']
summary: 'Measure first (Performance tab, Lighthouse). Check network (slow/many API calls), bundle (code splitting), and rendering (excessive reactivity).'
---

Follow a structured process: measure, identify the bottleneck category, fix, measure again. The bottleneck is always one of three things: the network (slow or too many API calls), the bundle (too much JavaScript shipped), or the rendering (too much work on the main thread).

## Step 1: Measure

Open browser DevTools and record a Performance trace of the page load. This gives you a flame chart that shows exactly where time is spent.

Key metrics to check:

- **Time to Interactive (TTI)**: when the page responds to input
- **Largest Contentful Paint (LCP)**: when the main content is visible
- **Total Blocking Time (TBT)**: how long the main thread was blocked

Also run a Lighthouse audit (DevTools > Lighthouse tab) for a scored summary with specific recommendations.

## Step 2: Check the network

Open the Network tab and reload. Look for:

**Slow API calls**: one endpoint taking 2 seconds makes the whole page wait. Fix on the backend (database queries, caching, pagination) or fetch in parallel instead of sequentially.

```vue
<script setup>
// BAD: sequential — total time = A + B + C
const users = await fetch('/api/users').then((r) => r.json())
const posts = await fetch('/api/posts').then((r) => r.json())
const stats = await fetch('/api/stats').then((r) => r.json())

// GOOD: parallel — total time = max(A, B, C)
const [users, posts, stats] = await Promise.all([
  fetch('/api/users').then((r) => r.json()),
  fetch('/api/posts').then((r) => r.json()),
  fetch('/api/stats').then((r) => r.json())
])
</script>
```

**Too many requests**: 20 API calls on page load means 20 round trips. Combine into fewer endpoints or use a BFF (Backend for Frontend) pattern.

**Large payloads**: an API returning 500 KB of JSON when the page only needs 10 fields. Add pagination, field selection, or compress the response.

## Step 3: Check the bundle size

Run `npx vite-bundle-visualizer` to see what's in your JavaScript bundle. Common problems:

**Importing entire libraries when you need one function**:

```js
// BAD: imports all of lodash (~70 KB)
import _ from 'lodash'

// GOOD: imports only debounce (~1 KB)
import debounce from 'lodash-es/debounce'
```

**Not code-splitting routes**:

```ts
// BAD: all routes in the main bundle
import Dashboard from './views/Dashboard.vue'
import Settings from './views/Settings.vue'

// GOOD: each route loads on demand
const Dashboard = () => import('./views/Dashboard.vue')
const Settings = () => import('./views/Settings.vue')
```

**Heavy components loaded eagerly**:

```vue
<script setup>
// BAD: chart library loads even if the tab isn't visible
import HeavyChart from './HeavyChart.vue'

// GOOD: loads only when rendered
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
</script>
```

## Step 4: Check Vue reactivity issues

Open Vue DevTools and look at the Performance tab. Sort components by render time.

**Too many or too deep refs**: `reactive()` on a 10,000-item array creates a Proxy for every nested object. Use `shallowRef` when you replace the data wholesale.

```js
// BAD: Vue creates Proxy wrappers for every item and nested property
const items = ref(hugeArrayFromApi)

// GOOD: only the top-level ref is reactive
const items = shallowRef(hugeArrayFromApi)
```

**Watchers causing cascading updates**: a `watch` that modifies state triggers another render, which triggers another watch.

```js
// BAD: watch triggers state change → re-render → watch fires again
watch(items, () => {
  filteredItems.value = items.value.filter((i) => i.active)
})

// GOOD: computed is cached, runs once per dependency change
const filteredItems = computed(() => items.value.filter((i) => i.active))
```

**Methods called in templates**: a method in a template expression runs on every render. A computed only runs when its dependencies change.

```vue
<!-- BAD: expensiveFilter() runs on every render -->
<div v-for="item in expensiveFilter(items)" :key="item.id">

<!-- GOOD: runs only when items change -->
<div v-for="item in filteredItems" :key="item.id">
```

## Step 5: Check rendering issues

**v-if vs v-show**: `v-if` destroys and recreates the DOM. For something that toggles frequently (tabs, tooltips), `v-show` just toggles `display: none`.

**Missing :key on v-for**: without a stable key, Vue can't track which items changed and re-renders the entire list instead of patching individual items.

**Large lists without virtualization**: 10,000 DOM nodes is expensive. Use `@tanstack/vue-virtual` or `vue-virtual-scroller` to render only visible items.

```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(items, {
  itemHeight: 50
})
</script>
```

**Components re-rendering unnecessarily**: check Vue DevTools for components that re-render when they shouldn't. Common cause: unstable props (passing a new object reference every render).

## Step 6: Measure again

After each fix, re-run the Performance trace and Lighthouse audit. Compare TTI, LCP, and TBT before and after. If the numbers didn't improve, the fix targeted the wrong bottleneck. Go back to step 2.

## Diagnostic checklist

| Bottleneck             | Tool to identify                  | Common fixes                                  |
| ---------------------- | --------------------------------- | --------------------------------------------- |
| Slow APIs              | Network tab, waterfall chart      | Parallel requests, caching, pagination        |
| Too many requests      | Network tab, request count        | Combine endpoints, BFF                        |
| Large bundle           | vite-bundle-visualizer            | Code splitting, lazy routes, tree shaking     |
| Deep reactivity        | Vue DevTools performance tab      | shallowRef, avoid deep reactive on large data |
| Cascading watchers     | Vue DevTools timeline             | Replace watch with computed                   |
| Large lists            | Elements tab, DOM node count      | Virtual scrolling                             |
| Unnecessary re-renders | Vue DevTools component highlights | Stable props, v-once, v-memo                  |

## The interview structure

When answering this question in an interview, follow the process in order: measure, network, bundle, reactivity, rendering, measure again. Walking through a structured diagnostic process shows more engineering maturity than listing random optimizations.

See also: [How would you optimize performance in a Vue app?](/q/performance-optimization) · [What is v-once and v-memo?](/q/v-once-v-memo) · [How would you virtualize a list?](/q/list-virtualization) · [What is tree-shaking?](/q/tree-shaking-vue3)

## References

- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Chrome docs
- [Web Vitals](https://web.dev/articles/vitals) - web.dev
