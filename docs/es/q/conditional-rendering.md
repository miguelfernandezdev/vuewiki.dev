---
order: 14
title: "¿Qué es el renderizado condicional en Vue?"
difficulty: "beginner"
tags: ["directives"]
summary: "v-if añade/elimina elementos del DOM. v-show cambia el CSS display. Usa v-if para cambios raros, v-show para frecuentes."
---

El renderizado condicional controla si los elementos aparecen en el DOM según el estado reactivo. Vue ofrece dos mecanismos: [`v-if`](https://vuejs.org/api/built-in-directives.html#v-if) (añade o elimina elementos) y [`v-show`](https://vuejs.org/api/built-in-directives.html#v-show) (alterna la propiedad CSS `display`).

## v-if, v-else-if, v-else

Estas directivas añaden o eliminan elementos del DOM por completo.

```vue
<template>
  <div v-if="status === 'loading'">Loading...</div>
  <div v-else-if="status === 'error'">Something went wrong</div>
  <div v-else>{{ data }}</div>
</template>

<script setup>
import { ref } from 'vue'

const status = ref('loading')
const data = ref(null)
</script>
```

Los elementos deben ser hermanos. No puedes poner otros elementos entre `v-if` y `v-else`:

```vue
<!-- Incorrecto: el <hr> rompe la cadena -->
<div v-if="ok">Yes</div>
<hr />
<div v-else>No</div>

<!-- Correcto: hermanos, sin separación -->
<div v-if="ok">Yes</div>
<div v-else>No</div>
```

## v-if en template

Para renderizar condicionalmente varios elementos sin añadir un wrapper al DOM:

```vue
<template v-if="loggedIn">
  <h1>Welcome back</h1>
  <p>Your dashboard is ready</p>
</template>
```

## v-show

`v-show` mantiene el elemento en el DOM y alterna `display: none`.

```vue
<div v-show="isVisible">Always in the DOM, just hidden</div>
```

## v-if frente a v-show

| | `v-if` | `v-show` |
|---|---|---|
| Comportamiento en el DOM | Añade/elimina elementos | Alterna `display: none` |
| Coste de renderizado inicial | Más barato si la condición es false (no renderiza nada) | Siempre se renderiza |
| Coste al alternar | Caro (destruye y vuelve a crear) | Barato (solo CSS) |
| Soporta `<template>` | Sí | No |
| Soporta `v-else` | Sí | No |
| Dispara lifecycle hooks | Sí, en cada alternancia | Solo en el primer renderizado |

**Regla general:** usa `v-show` para cosas que el usuario alterna con frecuencia (pestañas, desplegables, tooltips). Usa `v-if` para condiciones que raramente cambian o cuando quieres evitar el coste de renderizado inicial.

## Problema común: v-if con v-for

Nunca pongas `v-if` y `v-for` en el mismo elemento. En Vue 3, `v-if` tiene mayor precedencia, así que se ejecuta antes que `v-for` y no puede acceder a la variable de iteración.

```vue
<!-- Incorrecto: v-if no puede ver "item" -->
<li v-for="item in items" v-if="item.active" :key="item.id">
  {{ item.name }}
</li>

<!-- Correcto: filtra con computed -->
<li v-for="item in activeItems" :key="item.id">
  {{ item.name }}
</li>
```

```ts
const activeItems = computed(() => items.value.filter(i => i.active))
```

Ver también: [¿Cuál es la diferencia entre v-if y v-show?](/es/q/v-if-vs-v-show) · [¿Por qué no debes usar v-if con v-for?](/es/q/v-if-with-v-for)

## Referencias

- [Renderizado Condicional](https://vuejs.org/guide/essentials/conditional.html) - Docs de Vue.js
- [v-if](https://vuejs.org/api/built-in-directives.html#v-if) - Docs de Vue.js
- [v-show](https://vuejs.org/api/built-in-directives.html#v-show) - Docs de Vue.js
