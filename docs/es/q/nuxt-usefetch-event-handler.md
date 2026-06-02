---
order: 160
title: "¿Qué pasa si llamas a useFetch dentro de un event handler?"
difficulty: "intermediate"
tags: ["nuxt", "errors", "vueuse"]
summary: "useFetch necesita contexto del componente — llámalo en el nivel superior de setup(), no en event handlers. Usa $fetch para peticiones del usuario."
---

No funciona como se espera. `useFetch` y `useAsyncData` deben llamarse en el nivel superior de `<script setup>` (o en un plugin/middleware), no dentro de event handlers, callbacks o lifecycle hooks. Dependen del contexto del componente de Nuxt para registrarse en la transferencia del payload SSR y la deduplicación. Dentro de un event handler, ese contexto desaparece. Usa `$fetch` directamente para peticiones disparadas por acciones del usuario.

## El problema

```vue
<script setup>
async function handleClick() {
  // Esto generará un aviso o se comportará incorrectamente
  const { data } = await useFetch('/api/submit')
}
</script>

<template>
  <button @click="handleClick">Enviar</button>
</template>
```

`useFetch` llama internamente a `useAsyncData`, que llama a `getCurrentInstance()` para vincularse al ciclo de vida del componente. Dentro de un event handler, el contexto asíncrono puede haberse perdido, por lo que el composable no puede registrarse correctamente. El resultado: integración con el payload rota, reactividad defectuosa o un aviso en tiempo de ejecución sobre el uso de composables fuera de setup.

## Por qué existe esta restricción

Los composables de Nuxt como `useFetch` hacen varias cosas durante setup:

1. Registran una clave en el sistema de payload SSR
2. Comprueban si los datos ya existen en el payload (para omitir la petición en la hydration del cliente)
3. Vinculan refs reactivos a la instancia del componente
4. Configuran la cancelación automática de la petición al desmontar el componente

Todo esto depende de que el contexto del componente esté disponible. Durante setup, lo está. Dentro de un event handler que se dispara minutos después, no está garantizado.

## La solución: usar $fetch

Para peticiones disparadas por acciones del usuario, usa `$fetch` directamente:

```vue
<script setup>
const result = ref(null)
const isLoading = ref(false)
const error = ref(null)

async function handleSubmit() {
  isLoading.value = true
  error.value = null
  try {
    result.value = await $fetch('/api/submit', {
      method: 'POST',
      body: { name: 'Alice' }
    })
  } catch (e) {
    error.value = e
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button @click="handleSubmit" :disabled="isLoading">Enviar</button>
  <p v-if="error">{{ error.message }}</p>
  <p v-if="result">¡Hecho!</p>
</template>
```

`$fetch` es un cliente HTTP simple (basado en ofetch). No necesita el contexto del componente y funciona en cualquier lugar: event handlers, watchers, funciones de utilidad, rutas de servidor.

## Alternativa: useFetch con immediate: false

Si quieres las ventajas reactivas de `useFetch` (refs automáticos de `data`, `error` y `status`) pero no quieres que se ejecute de inmediato, decláralo en el nivel superior con `immediate: false` y llama a `execute` en el handler:

```vue
<script setup>
const { data, error, status, execute } = useFetch('/api/submit', {
  method: 'POST',
  body: { name: 'Alice' },
  immediate: false
})

function handleSubmit() {
  execute()
}
</script>

<template>
  <button @click="handleSubmit" :disabled="status === 'pending'">
    Enviar
  </button>
  <p v-if="error">{{ error.message }}</p>
  <p v-if="data">¡Hecho!</p>
</template>
```

La llamada a `useFetch` ocurre durante setup (con el contexto disponible), pero la petición HTTP real solo se dispara cuando se llama a `execute()`. Esto te da el estado reactivo de carga y error sin gestionar refs manualmente.

## La misma regla aplica a useAsyncData

```vue
<script setup>
// MAL: dentro de un callback
function onClick() {
  const { data } = useAsyncData('key', () => $fetch('/api/data'))
}

// BIEN: en el nivel superior con ejecución lazy
const { data, execute } = useAsyncData('key', () => $fetch('/api/data'), {
  immediate: false
})

function onClick() {
  execute()
}
</script>
```

## Actualizar datos existentes desde un handler

Si ya tienes un `useFetch` que cargó datos al abrir la página y quieres recargarlos tras una acción del usuario, usa `refresh`:

```vue
<script setup>
const { data: users, refresh } = useFetch('/api/users')

async function handleDelete(id: number) {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
  refresh()
}
</script>
```

`refresh()` vuelve a ejecutar el `useFetch` original con su contexto registrado. Esto es distinto a llamar a `useFetch` de nuevo dentro del handler.

## Referencia rápida

| Escenario | Usar |
|---|---|
| Cargar datos al renderizar la página (SSR) | `useFetch` / `useAsyncData` en el nivel superior |
| Enviar formulario al pulsar un botón | `$fetch` en el handler |
| Cargar datos a petición (lazy) | `useFetch` con `immediate: false` + `execute()` |
| Recargar datos existentes tras una mutación | `refresh()` en el `useFetch` existente |
| Petición en una función de utilidad | `$fetch` (no necesita contexto del componente) |

Ver también: [¿Cómo funciona el data fetching en Nuxt?](/es/q/nuxt-data-fetching) · [¿Cómo funciona el payload de SSR en Nuxt?](/es/q/nuxt-payload) · [¿Cómo funcionan las rutas de servidor de Nitro?](/es/q/nuxt-nitro-server-routes)

## Referencias

- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) - Nuxt docs
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
- [$fetch](https://nuxt.com/docs/api/utils/dollarfetch) - Nuxt docs
