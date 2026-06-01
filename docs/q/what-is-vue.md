---
order: 48
title: "What is Vue and what are its main features?"
difficulty: "beginner"
tags: ["core"]
---

Vue is a JavaScript framework for building user interfaces. It extends standard HTML, CSS, and JavaScript with a declarative, component-based model and a reactivity system that automatically updates the DOM when your data changes.

## Core features

**Declarative rendering.** You write templates that describe what the UI should look like for a given state. Vue keeps the DOM in sync.

```vue
<template>
  <p>Hello, {{ name }}</p>
</template>

<script setup>
import { ref } from 'vue'
const name = ref('World')
</script>
```

**Reactivity.** Vue tracks dependencies at runtime. When a reactive value changes, only the parts of the DOM that depend on it re-render.

```ts
const count = ref(0)
const doubled = computed(() => count.value * 2)

count.value++ // doubled automatically becomes 2
```

**Component-based architecture.** You build UIs by composing small, reusable components, each with its own template, logic, and styles.

```
App
├── Header
├── Sidebar
│   └── NavItem (x5)
└── MainContent
    ├── ArticleCard (x10)
    └── Pagination
```

**Single-File Components.** Each `.vue` file bundles template, script, and styles in one place, with optional scoped CSS.

```vue
<script setup>
// logic
</script>

<template>
  <!-- markup -->
</template>

<style scoped>
/* styles isolated to this component */
</style>
```

## How Vue compares to other frameworks

| Feature | Vue | React | Angular |
|---|---|---|---|
| Rendering | Template-based (with optional JSX) | JSX | Template-based |
| Reactivity | Built-in fine-grained (Proxy) | Manual (useState + re-render) | Zone.js / Signals |
| Styling | Scoped CSS, CSS Modules built-in | External solutions (CSS Modules, styled-components) | Component-scoped by default |
| Bundle size | ~33 KB min+gzip | ~40 KB min+gzip | ~90 KB min+gzip |
| Learning curve | Gentle | Moderate | Steep |

Vue's design philosophy is progressive adoption: start with just the core library for view rendering, then add official packages (Vue Router, Pinia, Nuxt) as your project grows. You never have to commit to the full stack upfront.
