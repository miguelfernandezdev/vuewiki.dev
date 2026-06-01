---
order: 83
title: "¿Qué son v-once y v-memo? ¿Cuándo deberías usarlos?"
difficulty: "advanced"
tags: ["directives", "performance"]
---

`v-once` renderiza un elemento una sola vez y omite todas las actualizaciones futuras. `v-memo` omite re-renders de forma condicional basándose en un array de dependencias. Ambos reducen el trabajo de render indicándole a Vue que ciertas partes del template no necesitan reevaluarse.

## v-once

Marca el contenido como estático tras el primer render. Vue crea el vnode una sola vez y lo reutiliza en cada actualización posterior.

```vue
<template>
  <!-- Se renderiza una vez, nunca se vuelve a evaluar -->
  <footer v-once>
    <p>Copyright {{ year }} {{ company }}</p>
  </footer>
</template>

<script setup>
const year = 2024
const company = 'Acme Corp'
</script>
```

Aunque `year` y `company` se interpolan en tiempo de ejecución, `v-once` le dice a Vue que sus valores nunca cambiarán, por lo que el subárbol queda congelado tras el primer render.

## v-memo

Memoiza un subárbol basándose en un array de dependencias. Vue omite el re-render cuando todos los valores del array son iguales a los del render anterior. Es más útil dentro de bucles `v-for`.

```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.id === selectedId]"
  >
    <div :class="{ selected: item.id === selectedId }">
      <ExpensiveComponent :data="item" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([/* 1.000 elementos */])
const selectedId = ref<number | null>(null)
</script>
```

Cuando cambia `selectedId`, solo dos elementos se re-renderizan: el que estaba seleccionado antes (de true a false) y el recién seleccionado (de false a true). Los otros 998 elementos se omiten por completo.

## v-memo con múltiples dependencias

```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.id === selectedId, item.id === editingId]"
  >
    <ItemCard
      :item="item"
      :selected="item.id === selectedId"
      :editing="item.id === editingId"
    />
  </div>
</template>
```

El elemento se re-renderiza solo cuando cambia su estado de selección o edición.

## v-memo con array vacío

`v-memo="[]"` es equivalente a `v-once`: el array de dependencias nunca cambia, por lo que el contenido nunca se vuelve a renderizar.

```vue
<div v-for="item in staticList" :key="item.id" v-memo="[]">
  {{ item.name }}
</div>
```

## Cuándo NO usarlos

```vue
<template>
  <!-- Error: count nunca se actualizará en la interfaz -->
  <div v-once>
    <span>Count: {{ count }}</span>
  </div>

  <!-- Error: v-model dentro de un subárbol memoizado no funcionará correctamente -->
  <div v-memo="[selected]">
    <input v-model="item.name" />
  </div>

  <!-- Innecesario: el coste de la memoización supera al del re-render de un <span> -->
  <span v-once>{{ label }}</span>
</template>
```

## Cuándo usar cada uno

| Escenario | Usa |
|---|---|
| Contenido que usa datos en tiempo de ejecución pero nunca cambia tras el montaje | `v-once` |
| Lista grande donde solo cambian pocos elementos a la vez | `v-memo` con la condición cambiante |
| Marcado completamente estático (sin interpolación) | Ninguno, el compilador ya lo eleva |
| Contenido con hijos interactivos (inputs, v-model) | Ninguno, necesitan re-renderizarse |
| Elementos pequeños y simples | Ninguno, la optimización no vale la pena |

Perfila con Vue DevTools antes de añadir estas directivas. Son una optimización concreta para cuellos de botella medidos, no algo que debas usar a la ligera.
