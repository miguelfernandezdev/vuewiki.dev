---
order: 19
title: "What are Teleport, Fragments, and Suspense?"
difficulty: "intermediate"
tags: ["components"]
---

**Teleport** renders DOM in a different part of the tree (like React Portals):
```vue
<Teleport to="body">
  <Modal v-if="showModal" @close="showModal = false" />
</Teleport>
```

**Fragments** allow multiple root nodes (Vue 2 required a single root):
```vue
<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>
```

**Suspense** handles async components with a fallback:
```vue
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
```
