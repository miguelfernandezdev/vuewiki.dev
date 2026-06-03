---
order: 142
title: 'What is hydration and how does it work in Vue?'
difficulty: 'intermediate'
tags: ['ssr', 'vueuse']
summary: 'Vue takes over server-rendered HTML, walks the existing DOM, attaches event listeners, and connects reactivity, making static HTML interactive without re-rendering.'
---

Hydration is the process where Vue takes over static HTML that was rendered on the server and makes it interactive. The server sends fully rendered HTML so the user sees content immediately. Then Vue loads on the client, walks the existing DOM, attaches event listeners, and connects reactivity. The page becomes a live Vue app without re-rendering from scratch.

## How hydration works step by step

```
1. Server renders Vue components to HTML string
2. Server serializes app state into the HTML (usually as a <script> tag with JSON)
3. Browser receives HTML, displays it instantly (fast first paint)
4. Browser downloads the JavaScript bundle
5. Vue creates a client-side app instance with createSSRApp
6. Vue walks the existing DOM nodes and matches them to the virtual DOM
7. Vue attaches event listeners to existing elements
8. Vue restores reactive state from the serialized data
9. The page is now fully interactive
```

The key difference from a normal SPA mount: Vue does NOT create new DOM elements. It reuses what the server already rendered.

## createSSRApp vs createApp

```ts
// Client entry for SSR — hydrates existing markup
import { createSSRApp } from 'vue'
const app = createSSRApp(App)
app.mount('#app')

// Normal SPA — replaces #app with new DOM
import { createApp } from 'vue'
const app = createApp(App)
app.mount('#app')
```

`createSSRApp` tells Vue "there's already HTML in the DOM, match it and attach to it." `createApp` tells Vue "clear this element and render from scratch."

## Hydration mismatches

A mismatch happens when the HTML the client would render differs from what the server sent. Vue logs a warning and tries to recover by discarding the server HTML and re-rendering that part, which causes flickering and performance loss.

### Common causes

**Browser-corrected HTML.** Browsers fix invalid nesting automatically, creating different DOM than Vue expects:

```vue
<!-- Server sends this -->
<p><div>Content</div></p>

<!-- Browser corrects to this -->
<p></p>
<div>Content</div>
<p></p>

<!-- Vue expects the original — mismatch -->
```

<PlaygroundLink code="<!-- Server sends this -->
<p><div>Content</div></p>
&#10;<!-- Browser corrects to this -->
<p></p>
<div>Content</div>
<p></p>
&#10;<!-- Vue expects the original — mismatch -->" />

**Different values on server vs client.** `Date.now()`, `Math.random()`, or locale-dependent formatting produce different output:

```vue
<template>
  <!-- Server: "6/1/2026" — Client: "01/06/2026" (different locale) -->
  <span>{{ new Date().toLocaleDateString() }}</span>
</template>
```

<PlaygroundLink code="<template>
  <!-- Server: &quot;6/1/2026&quot; — Client: &quot;01/06/2026&quot; (different locale) -->
  <span>{{ new Date().toLocaleDateString() }}</span>
</template>" />

**Browser-only APIs used during SSR.** Accessing `window.innerWidth` on the server returns `undefined`, but returns a number on the client.

### How to fix mismatches

**Move browser-dependent values to onMounted:**

```vue
<script setup>
const now = ref('')

onMounted(() => {
  now.value = new Date().toLocaleString()
})
</script>

<template>
  <span>{{ now }}</span>
</template>
```

<PlaygroundLink code="<script setup>
const now = ref('')
&#10;onMounted(() => {
  now.value = new Date().toLocaleString()
})
</script>
&#10;<template>
  <span>{{ now }}</span>
</template>" />

**Use ClientOnly (Nuxt) for browser-only components:**

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

<PlaygroundLink code="<template>
  <ClientOnly>
    <BrowserOnlyChart />
    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </ClientOnly>
</template>" />

    <template #fallback>
      <p>Loading chart...</p>
    </template>
  </ClientOnly>
</template>" />

**Allow intentional mismatches (Vue 3.5+):**

```vue
<template>
  <span data-allow-mismatch>{{ new Date().toLocaleString() }}</span>
</template>
```

<PlaygroundLink code="<template>
  <span data-allow-mismatch>{{ new Date().toLocaleString() }}</span>
</template>" />

This suppresses the warning for cases where you know the mismatch is harmless.

## State serialization

During SSR, the server serializes the app state into the HTML so the client can restore it without re-fetching:

```html
<!-- Server injects this -->
<script>
  window.__PINIA_STATE__ = { user: { id: 1, name: 'Alice' } }
</script>
```

The client reads this data during hydration and initializes stores with it. This is why `useFetch` in Nuxt doesn't re-fetch on the client: the data is already in the serialized payload.

## Hydration timeline

| Phase        | What the user sees | Interactive?     |
| ------------ | ------------------ | ---------------- |
| HTML arrives | Full content       | No (static HTML) |
| CSS loads    | Styled content     | No               |
| JS downloads | Styled content     | No               |
| Vue hydrates | Same content       | Yes              |

The gap between "content visible" and "fully interactive" is called the Time to Interactive (TTI). Minimizing JS bundle size and using lazy hydration strategies reduce this gap.

## Lazy hydration (Nuxt)

Nuxt lets you defer hydration of specific components to reduce TTI:

```vue
<template>
  <LazyComments hydrate-on-visible />
  <LazyAnalytics hydrate-on-idle />
  <LazyDropdown hydrate-on-interaction />
  <LazyStaticFooter hydrate-never />
</template>
```

<PlaygroundLink code="<template>
  <LazyComments hydrate-on-visible />
  <LazyAnalytics hydrate-on-idle />
  <LazyDropdown hydrate-on-interaction />
  <LazyStaticFooter hydrate-never />
</template>" />

  <LazyAnalytics hydrate-on-idle />
  <LazyDropdown hydrate-on-interaction />
  <LazyStaticFooter hydrate-never />
</template>" />

The component's HTML is visible from SSR, but Vue only hydrates it (attaches JS) when the trigger fires. Content below the fold or non-critical components can hydrate later without blocking the main page.

See also: [What is SSR?](/q/what-is-ssr) · [What causes SSR hydration mismatches?](/q/ssr-hydration-mismatch) · [How do you avoid platform-specific API issues in SSR?](/q/ssr-platform-specific-apis)

## References

- [Client Hydration](https://vuejs.org/guide/scaling-up/ssr.html#client-hydration) - Vue.js docs
- [Rendering](https://nuxt.com/docs/getting-started/rendering) - Nuxt docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
