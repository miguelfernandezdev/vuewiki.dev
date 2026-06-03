---
order: 124
title: '¿Cómo virtualizarías una lista de miles de elementos?'
difficulty: 'advanced'
tags: ['performance', 'slots']
summary: 'Renderiza solo los elementos visibles en el viewport con vue-virtual-scroller. Una lista de 10.000 elementos usa ~20 nodos DOM en vez de 10.000.'
---

La virtualización de listas renderiza solo los elementos visibles en el viewport en lugar de crear nodos del DOM para cada elemento. Una lista de 10.000 elementos con virtualización sigue usando alrededor de 20 nodos del DOM, igual que una lista de 100.

## El problema

```vue
<template>
  <!-- 10.000 componentes UserCard montados a la vez -->
  <div class="list">
    <UserCard v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>
```

Cada nodo del DOM consume memoria, y montar 10.000 componentes bloquea el hilo principal. El navegador sufre o se bloquea.

## Solución: vue-virtual-scroller

La opción más popular. `RecycleScroller` recicla los nodos del DOM a medida que el usuario se desplaza.

```vue
<template>
  <RecycleScroller
    class="list"
    :items="users"
    :item-size="80"
    key-field="id"
    v-slot="{ item }"
  >
    <UserCard :user="item" />
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
</script>

<style scoped>
.list {
  height: 600px; /* el contenedor debe tener altura fija */
}
</style>
```

Para elementos de altura variable, usa `DynamicScroller`:

```vue
<template>
  <DynamicScroller :items="messages" :min-item-size="54" key-field="id">
    <template #default="{ item, index, active }">
      <DynamicScrollerItem :item="item" :active="active" :data-index="index">
        <ChatMessage :message="item" />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>
```

## Alternativa: @tanstack/vue-virtual

Un virtualizador headless que te da control total sobre el renderizado. Sin estilos propios ni componente contenedor.

```vue
<template>
  <div ref="parentRef" class="list-container">
    <div
      :style="{
        height: `${virtualizer.getTotalSize()}px`,
        position: 'relative'
      }"
    >
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${row.size}px`,
          transform: `translateY(${row.start}px)`
        }"
      >
        <UserCard :user="users[row.index]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

const users = ref([
  /* miles de elementos */
])
const parentRef = ref(null)

const virtualizer = useVirtualizer({
  count: users.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 80,
  overscan: 5
})
</script>

<style scoped>
.list-container {
  height: 600px;
  overflow: auto;
}
</style>
```

## Comparativa de librerías

| Librería                  | Enfoque                              | Ideal para                             |
| ------------------------- | ------------------------------------ | -------------------------------------- |
| `vue-virtual-scroller`    | Basado en componentes, todo incluido | Configuración rápida, mayoría de casos |
| `@tanstack/vue-virtual`   | Composable headless                  | Layouts personalizados, control total  |
| `vue-virtual-scroll-grid` | Virtualización 2D                    | Layouts de cuadrícula o galería        |

## Cuándo NO virtualizar

- Listas de menos de 50-100 elementos con contenido simple (el overhead no merece la pena)
- Layouts de impresión donde todo el contenido debe renderizarse
- Contenido crítico para SEO que necesita estar en el HTML inicial
- Escenarios de accesibilidad donde todos los elementos deben ser alcanzables por lectores de pantalla a la vez

Ver también: [¿Cómo optimizar el rendimiento en una app Vue?](/es/q/performance-optimization) · [¿Cómo funcionan las optimizaciones de estabilidad de props?](/es/q/perf-props-stability) · [¿Cómo diagnosticar una página lenta?](/es/q/diagnose-slow-page)

## Referencias

- [Performance](https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists) - Vue.js docs
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) - GitHub
- [@tanstack/virtual](https://tanstack.com/virtual/latest) - TanStack docs
