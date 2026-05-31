---
order: 13
title: "¿Qué son los slots y para qué sirven?"
difficulty: "intermediate"
tags: ["components"]
---

Los slots permiten que un componente padre inyecte contenido en un componente hijo. Hay tres tipos:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <!-- Slot por defecto -->
    <slot />

    <!-- Slot con nombre -->
    <header>
      <slot name="header" />
    </header>

    <!-- Scoped slot: pasa datos al padre -->
    <slot name="item" :data="internalData" :index="currentIndex" />
  </div>
</template>
```

```vue
<!-- Uso -->
<Card>
  <p>Default slot content</p>

  <template #header>
    <h2>My title</h2>
  </template>

  <template #item="{ data, index }">
    <span>{{ index }}: {{ data.name }}</span>
  </template>
</Card>
```

Los **scoped slots** son muy potentes: permiten que el padre decida cómo renderizar datos que provienen del hijo (patrón de delegación de renderizado).
