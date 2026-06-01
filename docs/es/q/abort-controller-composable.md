---
order: 138
title: "¿Cómo cancelas una petición API en un composable?"
difficulty: "intermediate"
tags: ["composables"]
---

Usa la API `AbortController` del navegador. Crea un controller, pasa su `signal` a `fetch`, y llama a `controller.abort()` cuando necesites cancelar. En Vue, los dos motivos más comunes para cancelar son el desmontaje del componente (evitar actualizaciones de estado en componentes destruidos) y las peticiones nuevas que reemplazan a las antiguas (prevención de condiciones de carrera).

## Conceptos básicos de AbortController

```js
const controller = new AbortController()

fetch('/api/users', { signal: controller.signal })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Request was cancelled')
    }
  })

// Cancela la petición
controller.abort()
```

Llamar a `abort()` rechaza la promesa de fetch con un `AbortError`. Se comprueba `err.name` para distinguir las cancelaciones de los errores reales.

## Cancelar al desmontar

Cuando un componente se desmonta mientras una petición está en curso, la respuesta llega después de que el componente haya sido destruido. Actualizar el estado de un componente destruido es una pérdida de memoria y puede causar advertencias.

```ts
// composables/useFetch.ts
export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  let controller: AbortController | null = null

  async function execute() {
    controller?.abort()
    controller = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(toValue(url), {
        signal: controller.signal
      })
      data.value = await response.json()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        error.value = e as Error
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(() => toValue(url), execute, { immediate: true })

  onUnmounted(() => controller?.abort())

  return { data, error, isLoading, execute }
}
```

```vue
<script setup>
const { data: users, isLoading } = useFetch<User[]>('/api/users')
// Si el componente se desmonta, la petición se cancela automáticamente
</script>
```

El hook `onUnmounted` cancela cualquier petición en curso. El catch de `AbortError` mantiene el estado de error limpio.

## Cancelar peticiones obsoletas (condición de carrera)

Cuando la URL cambia rápidamente (búsqueda en tiempo real), pueden estar en curso varias peticiones a la vez. Sin cancelación, los resultados pueden llegar en orden incorrecto:

```
El usuario escribe: "v" → "vu" → "vue"
Petición 1: /api/search?q=v    (enviada primero)
Petición 2: /api/search?q=vu   (enviada segunda)
Petición 3: /api/search?q=vue  (enviada tercera)

Orden de respuesta: Petición 2, Petición 3, Petición 1
Resultado mostrado: resultados de "v" (incorrecto)
```

El composable anterior ya gestiona esto. Cada llamada a `execute` cancela el controller anterior antes de crear uno nuevo:

```vue
<script setup>
const query = ref('')
const searchUrl = computed(() => `/api/search?q=${query.value}`)

const { data: results, isLoading } = useFetch(searchUrl)
</script>

<template>
  <input v-model="query" placeholder="Search..." />
  <ul v-if="results">
    <li v-for="item in results" :key="item.id">{{ item.name }}</li>
  </ul>
</template>
```

Cuando `query` cambia de "vu" a "vue", el watcher ejecuta `execute`, que cancela la petición "vu" e inicia la petición "vue". Solo llega el último resultado.

## Con axios

Axios soporta `AbortController` de la misma forma:

```ts
import axios from 'axios'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  let controller: AbortController | null = null

  async function execute() {
    controller?.abort()
    controller = new AbortController()

    try {
      const response = await axios.get<T>(toValue(url), {
        signal: controller.signal
      })
      data.value = response.data
    } catch (e) {
      if (!axios.isCancel(e)) {
        // gestionar errores reales
      }
    }
  }

  watch(() => toValue(url), execute, { immediate: true })
  onUnmounted(() => controller?.abort())

  return { data, execute }
}
```

Axios ofrece `axios.isCancel(e)` como comprobación más limpia que comparar `error.name`.

## Timeout con AbortSignal.timeout

Para peticiones que deben fallar después de un tiempo límite, usa `AbortSignal.timeout` (disponible en navegadores modernos):

```ts
async function execute() {
  controller?.abort()
  controller = new AbortController()

  const timeoutSignal = AbortSignal.timeout(5000)
  const combinedSignal = AbortSignal.any([
    controller.signal,
    timeoutSignal
  ])

  const response = await fetch(toValue(url), {
    signal: combinedSignal
  })
  // ...
}
```

`AbortSignal.any` combina varias señales. La petición se cancela si el componente se desmonta (cancelación manual) o si pasan 5 segundos (timeout).

## Cancelación integrada en Nuxt

`useFetch` y `useAsyncData` de Nuxt gestionan la cancelación automáticamente. Cuando el componente se desmonta o los parámetros observados cambian, Nuxt cancela la petición anterior:

```vue
<script setup>
const query = ref('')

const { data: results } = useFetch('/api/search', {
  query: { q: query }
})
// Nuxt cancela las peticiones obsoletas y limpia al desmontar
</script>
```

No se necesita `AbortController` manual. Esta es una de las razones para preferir la obtención de datos de Nuxt sobre `fetch` directo en aplicaciones Nuxt.

## Cuándo cancelar

| Escenario | Por qué cancelar |
|---|---|
| El componente se desmonta | Evitar actualizaciones de estado en componente destruido |
| El campo de búsqueda cambia | Evitar que resultados obsoletos sobreescriban los nuevos |
| Navegación de ruta | Dejar de cargar datos de una página que el usuario abandonó |
| Timeout | Fallar rápido en lugar de esperar indefinidamente |
| El usuario pulsa "cancelar" | Respetar la intención explícita del usuario |
