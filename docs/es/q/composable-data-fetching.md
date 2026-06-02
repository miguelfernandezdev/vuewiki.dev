---
order: 91
title: "¿Cómo construirías un composable para data fetching?"
difficulty: "intermediate"
tags: ["composables", "pinia", "vueuse", "watchers"]
---

Data fetching es una de las primeras cosas que extraerás en un [composable](/es/q/what-is-a-composable). Cada componente que carga datos de una API repite el mismo patrón: un flag de loading, un estado de error, los datos en sí, y la lógica de fetch. Un composable `useFetch` envuelve todo eso en una función reutilizable.

## Implementación básica

```ts
import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    execute()
  })

  return { data, error, loading, refetch: execute }
}
```

Decisiones de diseño clave:

- **`MaybeRefOrGetter<string>`** — la URL puede ser un string plano, un ref, o un getter. [`toValue()`](https://vuejs.org/api/reactivity-utilities.html#tovalue) desenvuelve lo que sea. Esta es la convención Vue 3.3+ para inputs de composables.
- **`watchEffect`** — se ejecuta inmediatamente (hace fetch al crearse) y se re-ejecuta cuando la URL cambia. Si la URL es estática, hace fetch una sola vez.
- **Devuelve refs** — el que llama obtiene `data`, `error` y `loading` reactivos que se actualizan conforme avanza la petición.
- **`refetch`** — expone la función execute para que el que llama pueda reintentar o refrescar manualmente.

## Usándolo en un componente

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFetch } from '@/composables/useFetch'

const props = defineProps<{ userId: number }>()

const { data: user, error, loading } = useFetch<User>(
  () => `/api/users/${props.userId}`
)
</script>

<template>
  <div v-if="loading">Cargando...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else-if="user">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
  </div>
</template>
```

Pasar un getter (`() => /api/users/${props.userId}`) significa que el composable hace refetch automáticamente cuando `userId` cambia.

## ¿Y AbortController?

Un composable de producción debería cancelar las peticiones en curso cuando la URL cambia o el componente se desmonta. Consulta [¿Cómo se usa AbortController en un composable?](/es/q/abort-controller-composable) para ese patrón.

## Cuándo usar una librería

Para apps reales, considera [`useFetch` de VueUse](https://vueuse.org/core/useFetch/) o librerías dedicadas de data-fetching como [Pinia Colada](https://pinia-colada.esm.dev/) o [TanStack Query](https://tanstack.com/query/latest/docs/framework/vue/overview). Manejan caché, deduplicación, lógica de reintentos y patrones stale-while-revalidate que un composable simple no cubre.

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cómo se usa AbortController en un composable?](/es/q/abort-controller-composable) · [¿Qué es VueUse?](/es/q/vueuse)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Async State Example](https://vuejs.org/guide/reusability/composables.html#async-state-example) - Vue.js docs
- [toValue()](https://vuejs.org/api/reactivity-utilities.html#tovalue) - Vue.js docs
