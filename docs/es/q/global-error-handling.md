---
order: 167
title: '¿Cómo implementarías el manejo global de errores en una app Vue?'
difficulty: 'advanced'
tags: ['error-handling', 'architecture']
summary: 'app.config.errorHandler captura todos los errores no manejados globalmente. Combínalo con onErrorCaptured para subárboles y try/catch para operaciones async.'
---

Vue proporciona múltiples capas para capturar errores: `app.config.errorHandler` para errores no capturados de forma global, `onErrorCaptured` para errores en un subárbol de componentes, y try/catch para operaciones asíncronas. Una app en producción debería combinar los tres, más una interfaz de error visible para el usuario.

## app.config.errorHandler (captura global)

Es la última línea de defensa. Captura cualquier error no gestionado de componentes, watchers, lifecycle hooks y manejadores de eventos:

```ts
// main.ts
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Error no gestionado:', err)
  console.error('Componente:', instance?.$options?.name || 'desconocido')
  console.error('Hook:', info)

  // Enviar al servicio de seguimiento de errores
  reportToSentry(err, { component: instance?.$options?.name, info })
}
```

| Parámetro  | Qué contiene                                                                                                                                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `err`      | El objeto Error                                                                                                                                                                                                                                                                          |
| `instance` | La instancia del componente que lanzó el error (o null)                                                                                                                                                                                                                                  |
| `info`     | Donde ocurrio el error: `'setup function'`, `'render function'`, `'watcher callback'`, etc. En builds de produccion, `info` es un codigo numerico abreviado en lugar de la cadena completa. Consulta la [Error Reference](https://vuejs.org/error-reference/) para las correspondencias. |

## onErrorCaptured (barrera a nivel de componente)

`onErrorCaptured` captura errores de cualquier componente descendiente. Funciona como una barrera de errores: puedes gestionar el error localmente e impedir que se propague hacia arriba.

```vue
<!-- components/ErrorBoundary.vue -->
<script setup lang="ts">
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  return false // detener propagación, no llega a app.config.errorHandler
})

function retry() {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="error-state">
    <h3>Algo salió mal</h3>
    <p>{{ error.message }}</p>
    <button @click="retry">Intentar de nuevo</button>
  </div>
  <slot v-else />
</template>
```

<PlaygroundLink code="<!-- components/ErrorBoundary.vue -->

<script setup lang=&quot;ts&quot;>
const error = ref<Error | null>(null)
&#10;onErrorCaptured((err) => {
  error.value = err
  return false // detener propagación, no llega a app.config.errorHandler
})
&#10;function retry() {
  error.value = null
}
</script>

&#10;<template>

  <div v-if=&quot;error&quot; class=&quot;error-state&quot;>
    <h3>Algo salió mal</h3>
    <p>{{ error.message }}</p>
    <button @click=&quot;retry&quot;>Intentar de nuevo</button>
  </div>
  <slot v-else />
</template>" />

Envuelve las secciones de tu app que pueden fallar:

```vue
<template>
  <AppHeader />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <AppFooter />
</template>
```

<PlaygroundLink code="<template>
  <AppHeader />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <AppFooter />
</template>" />

Si una página falla, la cabecera y el pie permanecen visibles. El usuario ve un mensaje de error con un botón de reintento en lugar de una pantalla en blanco.

## Valor de retorno de onErrorCaptured

| Retorno       | Efecto                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| `false`       | Error capturado, deja de propagarse                                          |
| `true` o nada | El error continúa hacia el padre y eventualmente a `app.config.errorHandler` |

## Manejo de errores asíncronos

`app.config.errorHandler` captura errores en lifecycle hooks y watchers asíncronos. Pero `$fetch`, `fetch` o cualquier promesa en un manejador de eventos necesita try/catch explícito:

```vue
<script setup>
const error = ref<string | null>(null)
const isLoading = ref(false)

async function submitForm(data: FormData) {
  error.value = null
  isLoading.value = true
  try {
    await $fetch('/api/submit', { method: 'POST', body: data })
    navigateTo('/success')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Algo salió mal'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="error" class="alert-error">{{ error }}</div>
  <form @submit.prevent="submitForm">...</form>
</template>
```

<PlaygroundLink code="<script setup>
const error = ref<string | null>(null)
const isLoading = ref(false)
&#10;async function submitForm(data: FormData) {
error.value = null
isLoading.value = true
try {
await $fetch('/api/submit', { method: 'POST', body: data })
navigateTo('/success')
} catch (e) {
error.value = e instanceof Error ? e.message : 'Algo salió mal'
} finally {
isLoading.value = false
}
}
</script>
&#10;<template>

  <div v-if=&quot;error&quot; class=&quot;alert-error&quot;>{{ error }}</div>
  <form @submit.prevent=&quot;submitForm&quot;>...</form>
</template>" />

## Composable para operaciones asíncronas

Extrae el patrón try/catch en un composable reutilizable:

```ts
// composables/useAsyncAction.ts
export function useAsyncAction<T>(action: () => Promise<T>) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const result = await action()
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { execute, isLoading, error }
}
```

```vue
<script setup>
const {
  execute: submit,
  isLoading,
  error
} = useAsyncAction(() =>
  $fetch('/api/submit', { method: 'POST', body: formData })
)
</script>
```

<PlaygroundLink code="<script setup>
const {
  execute: submit,
  isLoading,
  error
} = useAsyncAction(() =>
  $fetch('/api/submit', { method: 'POST', body: formData })
)
</script>" />

## Manejo de errores en Nuxt

Nuxt añade manejo de errores a nivel de framework por encima del de Vue:

**error.vue** captura errores fatales y muestra una pantalla de error a página completa:

```vue
<!-- error.vue -->
<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="goHome">Ir al inicio</button>
  </div>
</template>
```

<PlaygroundLink code="<!-- error.vue -->

<script setup lang=&quot;ts&quot;>
const props = defineProps<{ error: { statusCode: number; message: string } }>()
&#10;function goHome() {
  clearError({ redirect: '/' })
}
</script>

&#10;<template>

  <div class=&quot;error-page&quot;>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click=&quot;goHome&quot;>Ir al inicio</button>
  </div>
</template>" />

**showError / createError** para lanzar errores de forma explícita:

```ts
// En una página o middleware
throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' })
```

**NuxtErrorBoundary** para captura de errores con ámbito:

```vue
<template>
  <NuxtErrorBoundary>
    <SomeRiskyComponent />
    <template #error="{ error, clearError }">
      <p>{{ error.message }}</p>
      <button @click="clearError">Reintentar</button>
    </template>
  </NuxtErrorBoundary>
</template>
```

<PlaygroundLink code="<template>
  <NuxtErrorBoundary>
    <SomeRiskyComponent />
    <template #error=&quot;{ error, clearError }&quot;>
      <p>{{ error.message }}</p>
      <button @click=&quot;clearError&quot;>Reintentar</button>
    </template>
  </NuxtErrorBoundary>
</template>" />

## Capas de manejo de errores

```
Try/catch en manejadores de eventos (local, explícito)
        ↓ no capturado
onErrorCaptured en ErrorBoundary (subárbol de componentes)
        ↓ se propaga si no devuelve false
app.config.errorHandler (captura global)
        ↓ en Nuxt
error.vue (errores fatales a nivel de página)
```

Ver también: [¿Cómo depurar peticiones SSR?](/es/q/debug-ssr-requests) · [¿Qué causa los errores de hydration mismatch en SSR?](/es/q/ssr-hydration-mismatch) · [¿Cómo funciona el sistema de plugins de Vue?](/es/q/plugin-system)

## Referencias

- [errorHandler](https://vuejs.org/api/application.html#app-config-errorhandler) - Vue.js docs
- [onErrorCaptured](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
- [Error Handling](https://nuxt.com/docs/getting-started/error-handling) - Nuxt docs
