---
order: 35
title: "What are async components and defineAsyncComponent?"
difficulty: "intermediate"
tags: ["components", "performance", "vite", "suspense", "teleport"]
summary: "defineAsyncComponent wraps a dynamic import so the component's code loads only when needed, creating a separate chunk automatically."
---

Async components let you split your bundle by loading a component's code only when it's needed. Instead of importing the component at the top of the file (which bundles it with the parent), you wrap the import in `defineAsyncComponent` and Vite creates a separate chunk for it.

## Basic usage

```ts
import { defineAsyncComponent } from 'vue'

const AdminPanel = defineAsyncComponent(() => import('./AdminPanel.vue'))
```

`AdminPanel` behaves like a normal component in templates, but its code is only downloaded from the server when the component first renders.

## Loading and error states

The full options object lets you control what the user sees while the component loads or if it fails.

```ts
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 30000
})
```

| Option | Purpose |
|---|---|
| `loader` | The dynamic import function |
| `loadingComponent` | Shown while loading |
| `delay` | Milliseconds before showing the loading component (default: 200) |
| `errorComponent` | Shown if the import fails or times out |
| `timeout` | Milliseconds before treating it as a failure |

The `delay` prevents a spinner from flashing for components that load quickly. Keep it around 200ms unless you have a reason to change it.

## When to use async components

They make the biggest difference when the component is large and not always needed:

```ts
// Heavy component behind a condition
const ChartEditor = defineAsyncComponent(() => import('./ChartEditor.vue'))

// Route-level splitting (Vue Router does this automatically)
const routes = [
  { path: '/admin', component: () => import('./views/Admin.vue') }
]
```

Don't wrap small, always-visible components. The overhead of a separate network request outweighs the bundle savings.

## Lazy hydration (Vue 3.5+, SSR)

In SSR apps, async components render on the server but can delay hydration on the client until they're actually needed.

```ts
import {
  defineAsyncComponent,
  hydrateOnVisible,
  hydrateOnIdle,
  hydrateOnInteraction
} from 'vue'

// Hydrate when the user scrolls to it
const Comments = defineAsyncComponent({
  loader: () => import('./Comments.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '100px' })
})

// Hydrate during idle time
const Footer = defineAsyncComponent({
  loader: () => import('./Footer.vue'),
  hydrate: hydrateOnIdle(5000)
})

// Hydrate on first interaction
const SearchPanel = defineAsyncComponent({
  loader: () => import('./SearchPanel.vue'),
  hydrate: hydrateOnInteraction(['focus', 'click'])
})
```

This reduces the JavaScript the browser has to process before the page becomes interactive.

## Async components vs route-level splitting

| | `defineAsyncComponent` | Route lazy loading |
|---|---|---|
| Scope | Any component | Route-level views |
| Setup | Manual | Built into Vue Router |
| Loading UI | `loadingComponent` option | Router navigation guards |
| Use case | Conditional UI, heavy widgets | Page-level code splitting |

Route-level splitting (`() => import('./views/Page.vue')`) is the most common form of code splitting. `defineAsyncComponent` is for splitting within a page.

See also: [How does Suspense work for async components?](/q/suspense) · [What are dynamic components and KeepAlive?](/q/dynamic-components-keepalive) · [What are Teleport, Fragments, and Suspense?](/q/teleport-fragments-suspense)

## References

- [defineAsyncComponent()](https://vuejs.org/api/general.html#defineasynccomponent) - Vue.js docs
- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
