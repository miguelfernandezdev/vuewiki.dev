---
order: 87
title: "¿Cuál es la diferencia entre useFetch, useAsyncData y $fetch?"
difficulty: "intermediate"
tags: ["nuxt", "data-fetching"]
---

Nuxt ofrece tres formas de obtener datos. Cada una resuelve un problema distinto relacionado con SSR, hydration y la doble petición.

## $fetch

Un wrapper ligero sobre la Fetch API (basado en `ofetch`). Úsalo para eventos del lado del cliente como el envío de formularios o clics en botones.

```vue
<script setup>
async function submitForm(data: FormData) {
  const result = await $fetch('/api/submit', {
    method: 'POST',
    body: data
  })
}
</script>
```

**No uses** `$fetch` solo en `setup` para datos iniciales. Se ejecuta en el servidor Y en el cliente, haciendo la petición dos veces.

## useFetch

El composable principal para datos de componentes. Envuelve `$fetch` con conciencia de SSR: los datos obtenidos en el servidor se serializan en el payload del HTML, así que el cliente no vuelve a hacer la petición durante la hydration.

```vue
<script setup>
const { data, status, error, refresh } = await useFetch('/api/posts')
</script>

<template>
  <div v-if="status === 'pending'">Cargando...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

### Parámetros reactivos

Pasa refs como parámetros de consulta o usa una URL computed. `useFetch` vuelve a hacer la petición automáticamente cuando cambian:

```vue
<script setup>
const page = ref(1)
const { data } = await useFetch('/api/posts', {
  query: { page }
})

const id = ref(1)
const { data: post } = await useFetch(() => `/api/posts/${id.value}`)
</script>
```

### Opciones principales

```ts
const { data } = await useFetch('/api/posts', {
  pick: ['id', 'title'],           // solo mantener estos campos en el payload
  transform: (posts) => posts.slice(0, 5), // transformar antes de cachear
  default: () => [],                // valor por defecto mientras carga
  lazy: true,                       // no bloquear la navegación
  server: false,                    // omitir la petición en el servidor
  immediate: false,                 // no hacer la petición hasta llamar a execute()
})
```

## useAsyncData

Como `useFetch`, pero envuelve cualquier función asíncrona en lugar de solo `$fetch`. Úsalo cuando los datos vienen de una fuente personalizada o cuando necesitas combinar varias peticiones:

```vue
<script setup>
const { data } = await useAsyncData('cart', async () => {
  const [coupons, offers] = await Promise.all([
    $fetch('/api/coupons'),
    $fetch('/api/offers')
  ])
  return { coupons, offers }
})
</script>
```

El primer argumento es una clave única para el caché y la deduplicación.

## Cuándo usar cada uno

| Escenario | Usar |
|---|---|
| Obtener datos de un endpoint de API en un componente | `useFetch` |
| Combinar varias peticiones en una | `useAsyncData` con `Promise.all` |
| Obtener datos de una fuente no HTTP (base de datos, SDK) | `useAsyncData` |
| Clic en botón, envío de formulario, acción del usuario | `$fetch` |
| Datos iniciales en `setup` | `useFetch` o `useAsyncData`, nunca `$fetch` solo |

## Valores de retorno compartidos

Todos los composables devuelven la misma estructura:

| Propiedad | Tipo | Descripción |
|---|---|---|
| `data` | `Ref<T>` | Los datos obtenidos |
| `error` | `Ref<Error \| null>` | Error si la petición falló |
| `status` | `Ref<'idle' \| 'pending' \| 'success' \| 'error'>` | Estado actual |
| `refresh` | `() => Promise` | Volver a obtener los datos |
| `clear` | `() => void` | Resetear datos y error |

## Compartir datos entre componentes

```vue
<!-- Componente A: obtiene y cachea -->
<script setup>
const { data } = await useFetch('/api/user', { key: 'current-user' })
</script>

<!-- Componente B: lee del caché, sin petición extra -->
<script setup>
const { data } = useNuxtData('current-user')
</script>
```

Actualiza los datos cacheados desde cualquier lugar:

```ts
await refreshNuxtData('current-user')
```

Ver también: [¿Cómo funciona el payload de SSR en Nuxt?](/es/q/nuxt-payload) · [¿Qué pasa si llamas a useFetch dentro de un event handler?](/es/q/nuxt-usefetch-event-handler) · [¿Cómo funcionan las rutas de servidor de Nitro?](/es/q/nuxt-nitro-server-routes)

## Referencias

- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) - Nuxt docs
- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) - Nuxt docs
