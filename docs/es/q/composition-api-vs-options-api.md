---
order: 1
title: "¿Qué es la Composition API y en qué se diferencia de la Options API?"
difficulty: "beginner"
tags: ["composition-api"]
---

Vue ofrece dos formas de escribir la lógica de un componente. Entender ambas es importante porque encontrarás la Options API en proyectos existentes y la Composition API en todo lo nuevo.

## Options API

La [Options API](https://vuejs.org/guide/introduction.html#options-api) es el estilo original de Vue. Exportas un objeto con claves predefinidas — `data` para el estado, `methods` para funciones, `computed` para valores derivados, `watch` para efectos secundarios. Vue lee esas claves y conecta todo internamente.

```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>
```

Esto funciona bien en componentes pequeños. El problema aparece cuando un componente crece: la lógica de una sola funcionalidad (por ejemplo, búsqueda) se dispersa entre `data`, `computed`, `methods` y `watch`. Acabas saltando entre secciones para entender una sola feature.

## Composition API

La [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) (Vue 3) permite escribir lógica como funciones JavaScript normales. En lugar de separar por tipo de opción, agrupas el código por lo que hace.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
function increment() { count.value++ }
</script>
```

El estado reactivo (`ref`), los valores derivados (`computed`) y las funciones conviven juntos. Cuando el componente crece, puedes extraer la lógica relacionada en un [composable](/es/q/what-is-a-composable) — una función que devuelve estado reactivo — y reutilizarlo en otros componentes.

## Por qué la Composition API gana en proyectos reales

En un componente con búsqueda, paginación y filtros usando Options API, el código de cada feature queda fragmentado:

```txt
data()      → searchQuery, page, filters
computed    → filteredResults, totalPages, activeFilterCount
methods     → search(), nextPage(), toggleFilter()
watch       → watcher de searchQuery, watcher de filters
```

Con la Composition API, cada feature es un bloque autocontenido (o composable) que puedes leer de arriba abajo sin saltar entre secciones. Esa es la diferencia fundamental: **organización por funcionalidad en lugar de por tipo de opción**.

## ¿Cuál deberías aprender?

Ambas. La Composition API con [`<script setup>`](/es/q/script-setup) es el estilo recomendado para proyectos nuevos. Pero necesitas leer código con Options API porque la mayoría de apps Vue 2 existentes la usan, y muchos proyectos Vue 3 mezclan ambos estilos durante la migración.

Ver también: [¿Qué es script setup?](/es/q/script-setup) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Introducción: Options API vs Composition API](https://vuejs.org/guide/introduction.html#options-api) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
