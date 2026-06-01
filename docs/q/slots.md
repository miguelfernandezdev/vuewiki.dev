---
order: 13
title: "What are slots and what are they used for?"
difficulty: "intermediate"
tags: ["components"]
---

Slots allow a parent component to inject content into a child component. Three types:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <!-- Default slot -->
    <slot />

    <!-- Named slot -->
    <header>
      <slot name="header" />
    </header>

    <!-- Scoped slot: passes data to the parent -->
    <slot name="item" :data="internalData" :index="currentIndex" />
  </div>
</template>
```

```vue
<!-- Usage -->
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

**Scoped slots** let the parent decide how to render data from the child (render delegation pattern).
