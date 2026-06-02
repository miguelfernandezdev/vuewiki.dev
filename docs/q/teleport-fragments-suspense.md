---
order: 27
title: "What are Teleport, Fragments, and Suspense?"
difficulty: "intermediate"
tags: ["components", "suspense", "teleport"]
summary: "Teleport renders content outside the component tree. Fragments allow multiple root elements. Suspense handles async loading states."
---

These are three built-in features introduced in Vue 3. Each solves a different problem: rendering content outside the component tree, allowing multiple root elements, and handling async dependencies with loading states.

## Teleport

[`<Teleport>`](https://vuejs.org/guide/built-ins/teleport.html) renders its children into a different part of the DOM, outside the parent component's element. The component logic (props, events, reactivity) stays in place — only the DOM output moves.

```vue
<script setup>
import { ref } from 'vue'
const showModal = ref(false)
</script>

<template>
  <button @click="showModal = true">Open</button>

  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <p>This renders as a direct child of body</p>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>
```

Without Teleport, a modal inside a deeply nested component inherits all parent CSS (`overflow: hidden`, `z-index`, `transform`), which can clip or misposition it. Teleporting to `<body>` sidesteps those issues. The `to` prop accepts any CSS selector or DOM element.

Common uses: modals, tooltips, dropdown menus, notifications — anything that needs to visually escape its parent's layout.

## Fragments

In Vue 2, every component needed a single root element. This forced unnecessary wrapper `<div>`s:

```vue
<!-- Vue 2: required single root -->
<template>
  <div>
    <header>Header</header>
    <main>Content</main>
  </div>
</template>
```

Vue 3 supports **fragments** — multiple root elements with no wrapper:

```vue
<!-- Vue 3: multiple roots, no wrapper needed -->
<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>
```

One caveat: [fallthrough attributes](/q/fallthrough-attrs) don't work automatically with multi-root components because Vue doesn't know which root to apply them to. You need to bind `$attrs` explicitly.

## Suspense

[`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html) shows fallback content while waiting for async child components to resolve. It works with components that have an `async setup()` or that are loaded with [`defineAsyncComponent`](/q/async-components).

```vue
<template>
  <Suspense>
    <template #default>
      <UserDashboard />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

If `UserDashboard` has an async `setup` (returns a promise), Suspense shows `LoadingSpinner` until the promise resolves. You can also handle errors with [`onErrorCaptured`](/q/error-handling) in the parent.

> **Note:** Suspense is still an experimental API as of Vue 3.5. The core behavior is stable, but the API may have minor changes.

See also: [How does Suspense work for async components?](/q/suspense) · [What are async components?](/q/async-components) · [What are fallthrough attributes?](/q/fallthrough-attrs)

## References

- [Teleport](https://vuejs.org/guide/built-ins/teleport.html) - Vue.js docs
- [Fragments](https://v3-migration.vuejs.org/new/fragments.html) - Vue 3 Migration Guide
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
