---
order: 92
title: '¿Cómo implementarías debounce en un input de búsqueda?'
difficulty: 'intermediate'
tags: ['composables', 'performance', 'vueuse', 'watchers', 'v-model']
summary: 'Observa la ref del input y retrasa la actualización con setTimeout. Extráelo como composable o usa refDebounced de VueUse.'
---

Debouncing retrasa una acción hasta que el usuario deja de escribir durante un tiempo determinado. Sin él, un input de búsqueda dispara una llamada a la API en cada tecla. Escribir "vue router" envía 10 peticiones, la mayoría inútiles porque el usuario no ha terminado de escribir.

## Enfoque inline

La forma más simple: observar el valor del input y retrasar la actualización de la query real:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const searchQuery = ref('')
const debouncedQuery = ref('')

let timeout: ReturnType<typeof setTimeout>

watch(searchQuery, (newVal) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 300)
})
</script>

<template>
  <input v-model="searchQuery" placeholder="Buscar..." />
  <SearchResults :query="debouncedQuery" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { ref, watch } from 'vue'
&#10;const searchQuery = ref('')
const debouncedQuery = ref('')
&#10;let timeout: ReturnType<typeof setTimeout>
&#10;watch(searchQuery, (newVal) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 300)
})
</script>
&#10;<template>
  <input v-model=&quot;searchQuery&quot; placeholder=&quot;Buscar...&quot; />
  <SearchResults :query=&quot;debouncedQuery&quot; />
</template>" />

El usuario escribe en `searchQuery` (feedback instantáneo). Después de 300ms sin escribir, `debouncedQuery` se actualiza y dispara la búsqueda real. Cada nueva tecla reinicia el temporizador.

## Extraer un composable reutilizable

Si haces debounce en múltiples lugares, extrae el patrón:

```ts
import { ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(source, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = val
    }, delay)
  })

  return debounced
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

const searchQuery = ref('')
const debouncedQuery = useDebouncedRef(searchQuery, 300)
</script>

<template>
  <input v-model="searchQuery" placeholder="Buscar..." />
  <SearchResults :query="debouncedQuery" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { ref } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
&#10;const searchQuery = ref('')
const debouncedQuery = useDebouncedRef(searchQuery, 300)
</script>
&#10;<template>
  <input v-model=&quot;searchQuery&quot; placeholder=&quot;Buscar...&quot; />
  <SearchResults :query=&quot;debouncedQuery&quot; />
</template>" />

## Usando VueUse

[VueUse](https://vueuse.org/) tiene [`refDebounced`](https://vueuse.org/shared/refDebounced/) (misma idea, probado en producción) y [`useDebounceFn`](https://vueuse.org/shared/useDebounceFn/) (hace debounce a cualquier función):

```ts
import { ref } from 'vue'
import { refDebounced } from '@vueuse/core'

const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 300)
```

## Debounce vs throttle

**Debounce** espera hasta que la actividad se detiene (dispara una vez después del último evento). **Throttle** dispara a intervalos regulares durante la actividad (como máximo una vez por intervalo). Para inputs de búsqueda, debounce suele ser la opción correcta porque quieres esperar hasta que el usuario termine de escribir. Para handlers de scroll o resize, throttle suele ser mejor porque quieres actualizaciones periódicas mientras el evento está ocurriendo.

Ver también: [¿Qué es VueUse?](/es/q/vueuse) · [¿Cómo construirías un composable para data fetching?](/es/q/composable-data-fetching) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [refDebounced](https://vueuse.org/shared/refDebounced/) - VueUse docs
- [useDebounceFn](https://vueuse.org/shared/useDebounceFn/) - VueUse docs
