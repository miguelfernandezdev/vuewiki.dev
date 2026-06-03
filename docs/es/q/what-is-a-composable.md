---
order: 90
title: '¿Qué es un composable?'
difficulty: 'beginner'
tags: ['composables', 'composition-api', 'vueuse', 'watchers']
summary: 'Una función que encapsula lógica reutilizable usando la Composition API (refs, computed, watchers). Devuelve estado reactivo y métodos.'
---

A medida que tus componentes crecen, notarás partes de lógica que no pertenecen a ningún componente concreto: patrones de obtención de datos, validación de formularios, temporizadores, event listeners. Un composable es una función que empaqueta esa lógica reutilizable usando la [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html), para que puedas compartirla entre componentes sin duplicar código.

## El problema que resuelven los composables

Imagina dos componentes que necesitan un contador con incremento, decremento y reset. Sin composables, copiarías y pegarías el mismo `ref` + funciones en ambos componentes. Cuando necesites cambiar el comportamiento, tendrías que actualizar ambos sitios.

Un composable extrae esa lógica en una función:

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }
  function decrement() {
    count.value--
  }
  function reset() {
    count.value = initial
  }

  return { count, doubled, increment, decrement, reset }
}
```

```vue
<!-- Cualquier componente que necesite un contador -->
<script setup>
import { useCounter } from '@/composables/useCounter'

const { count, increment, reset } = useCounter(10)
</script>

<template>
  <p>{{ count }}</p>
  <button @click="increment">+</button>
  <button @click="reset">Reset</button>
</template>
```

Cada componente que llama a `useCounter()` obtiene su propia instancia independiente. No comparten estado a menos que diseñes explícitamente el composable para ello.

## Un ejemplo del mundo real: useFetch

Los composables brillan para patrones que repites en todas partes, como obtener datos:

```ts
// composables/useFetch.ts
import { ref, watchEffect } from 'vue'

export function useFetch<T>(url: () => string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  watchEffect(async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url())
      data.value = await res.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}
```

```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

const { data: users, loading, error } = useFetch<User[]>(() => '/api/users')
</script>
```

Ahora cada componente que obtiene datos recibe estado de carga, manejo de errores y rastreo reactivo de URL de forma gratuita.

## Convenciones

- **El nombre empieza por `use`**: `useCounter`, `useFetch`, `useAuth`. Esto indica que la función usa estado reactivo y debe llamarse dentro de `setup`.
- **Devolver un objeto**: devuelve propiedades con nombre para que los llamadores puedan desestructurar lo que necesiten.
- **Aceptar refs o getters como entradas**: esto hace los composables reactivos a entradas cambiantes.
- **Mantenerlos enfocados**: un composable = una responsabilidad. No mezcles lógica no relacionada.

## Composables vs mixins

Los composables reemplazan los mixins de Vue 2. Los mixins tenían problemas serios: colisiones de nombres de propiedades, fuentes de datos poco claras y dependencias implícitas. Los composables resuelven los tres porque todo se importa y devuelve explícitamente.

Ver también: [¿Cuál es el equivalente a los HOC en Vue?](/es/q/hoc-equivalents-vue) · [¿Qué es la Composition API y en qué se diferencia de la Options API?](/es/q/composition-api-vs-options-api)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
