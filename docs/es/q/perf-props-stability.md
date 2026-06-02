---
order: 126
title: "¿Cómo funcionan las optimizaciones de estabilidad de props?"
difficulty: "advanced"
tags: ["performance", "components"]
summary: "Vue salta el re-render de hijos cuando los props no cambian. Evita pasar valores compartidos (como activeId) a cada item — pasa solo un booleano."
---

Vue omite el re-render de un componente hijo cuando ninguna de sus props cambia. La estabilidad de props consiste en estructurarlas para que solo los componentes que realmente necesitan actualizarse reciban valores cambiados. La mayor ventaja está en las listas: pasar un valor compartido como `activeId` a todos los elementos obliga a re-renderizar todos, aunque solo dos elementos hayan cambiado de estado.

## El problema

```vue
<!-- Parent -->
<script setup>
const items = ref([/* 100 items */])
const activeId = ref<number | null>(null)
</script>

<template>
  <ListItem
    v-for="item in items"
    :key="item.id"
    :id="item.id"
    :active-id="activeId"
  />
</template>
```

```vue
<!-- ListItem.vue -->
<script setup>
const props = defineProps<{ id: number; activeId: number | null }>()
</script>

<template>
  <div :class="{ active: id === activeId }">{{ id }}</div>
</template>
```

Cuando `activeId` cambia de 1 a 2, la prop `activeId` cambia para los 100 elementos. Vue re-renderiza cada `ListItem`, aunque solo dos elementos necesiten una actualización visual: el que estaba activo antes y el que pasa a estar activo.

## La solución: pre-calcular en el padre

```vue
<!-- Parent -->
<template>
  <ListItem
    v-for="item in items"
    :key="item.id"
    :id="item.id"
    :active="item.id === activeId"
  />
</template>
```

```vue
<!-- ListItem.vue -->
<script setup>
defineProps<{ id: number; active: boolean }>()
</script>

<template>
  <div :class="{ active }">{{ id }}</div>
</template>
```

Ahora cuando `activeId` cambia de 1 a 2:
- Elemento 1: `:active` pasa de `true` a `false` (re-render)
- Elemento 2: `:active` pasa de `false` a `true` (re-render)
- Elementos 3-100: `:active` sigue siendo `false` (se omiten)

2 re-renders en lugar de 100.

## Patrones de props inestables más comunes

**Pasar todo el conjunto de selección:**

```vue
<!-- MAL: todos los elementos se re-renderizan cuando cambia cualquier selección -->
<Item
  v-for="item in items"
  :key="item.id"
  :selected-ids="selectedIds"
/>

<!-- BIEN: solo los elementos afectados se re-renderizan -->
<Item
  v-for="item in items"
  :key="item.id"
  :selected="selectedIds.has(item.id)"
/>
```

**Pasar la longitud de la lista o el índice:**

```vue
<!-- MAL: total cambia cada vez que cambia la lista -->
<Item
  v-for="(item, index) in items"
  :key="item.id"
  :index="index"
  :total="items.length"
/>

<!-- BIEN: pasar solo lo que el hijo realmente necesita -->
<Item
  v-for="item in items"
  :key="item.id"
  :is-last="item === items[items.length - 1]"
/>
```

**Pasar un objeto o función inline:**

```vue
<!-- MAL: nuevo objeto en cada render → referencia siempre diferente -->
<Item
  v-for="item in items"
  :key="item.id"
  :style="{ color: item.color }"
  :on-click="() => select(item.id)"
/>
```

Los objetos inline y las arrow functions crean una nueva referencia en cada render. Vue detecta una prop "nueva" y re-renderiza el hijo. Si el rendimiento importa, moverlos a computed o métodos.

## Impacto a escala

| Tamaño de lista | Prop inestable (activeId) | Prop estable (:active boolean) |
|---|---|---|
| 100 elementos | 100 re-renders | 2 re-renders |
| 1.000 elementos | 1.000 re-renders | 2 re-renders |
| 10.000 elementos | 10.000 re-renders | 2 re-renders |

La optimización tiene un coste constante (siempre 2) independientemente del tamaño de la lista. El enfoque directo tiene coste lineal.

## La regla

Si el valor de una prop cambia para TODOS los hijos pero solo ALGUNOS necesitan reaccionar, pre-calcular el valor derivado en el padre y pasar el resultado. El hijo debe recibir únicamente valores específicos de su propio estado.

Ver también: [¿Cómo mejora el rendimiento reducir la abstracción de componentes en listas?](/es/q/perf-component-abstraction-lists) · [¿Qué es el Virtual DOM y cómo lo usa Vue?](/es/q/virtual-dom) · [¿Cómo declarar props con TypeScript?](/es/q/props-with-typescript)

## Referencias

- [Props Stability](https://vuejs.org/guide/best-practices/performance.html#props-stability) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
