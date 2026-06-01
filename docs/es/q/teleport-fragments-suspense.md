---
order: 19
title: "¿Qué son Teleport, Fragments y Suspense?"
difficulty: "intermediate"
tags: ["components"]
---

**Teleport** renderiza el DOM en otra parte del árbol (similar a los Portals de React):
```vue
<Teleport to="body">
  <Modal v-if="showModal" @close="showModal = false" />
</Teleport>
```

**Fragments** permite múltiples nodos raíz (Vue 2 exigía un único nodo raíz):
```vue
<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>
```

**Suspense** gestiona componentes asíncronos con un fallback mientras cargan:
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
