---
order: 95
title: '¿Cómo se gestionan los errores en composables asíncronos?'
difficulty: 'intermediate'
tags: ['composables', 'error-handling', 'watchers']
summary: 'Devuelve una ref error junto a data e isLoading. El composable captura errores internamente y los expone como estado reactivo.'
---

Devuelve una ref `error` junto a `data` e `isLoading`. El composable captura los errores internamente y los expone como estado reactivo, para que el componente pueda renderizar la UI de error sin bloques try/catch en el template. Nunca dejes que los errores escapen en silencio, y nunca lances excepciones desde un composable a menos que quien lo llame lo espere explícitamente.

## Patrón básico

```ts
// composables/useFetchData.ts
export function useFetchData<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null

    try {
      data.value = await $fetch<T>(url)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  execute()

  return { data, error, isLoading, retry: execute }
}
```

```vue
<script setup>
const { data: users, error, isLoading, retry } = useFetchData<User[]>('/api/users')
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">
    <p>Failed to load: {{ error.message }}</p>
    <button @click="retry">Try again</button>
  </div>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

<PlaygroundLink code="<script setup>
const { data: users, error, isLoading, retry } = useFetchData<User[]>('/api/users')
</script>
&#10;<template>
  <div v-if=&quot;isLoading&quot;>Loading...</div>
  <div v-else-if=&quot;error&quot;>
    <p>Failed to load: {{ error.message }}</p>
    <button @click=&quot;retry&quot;>Try again</button>
  </div>
  <ul v-else-if=&quot;users&quot;>
    <li v-for=&quot;user in users&quot; :key=&quot;user.id&quot;>{{ user.name }}</li>
  </ul>
</template>" />

El componente gestiona los tres estados (carga, error, éxito) de forma declarativa. La función `retry` permite al usuario recuperarse de fallos transitorios.

## Por qué no lanzar excepciones

Si el composable lanza una excepción, el error se propaga hacia arriba y hace fallar el setup del componente. No hay nada que lo capture a menos que el componente envuelva la llamada en try/catch, lo que anula el propósito de que el composable abstraiga la lógica asíncrona:

```ts
// MAL: lanzar desde un composable
export function useFetchData<T>(url: string) {
  const data = ref<T | null>(null)

  onMounted(async () => {
    data.value = await $fetch<T>(url) // lanza en error — hace fallar el componente
  })

  return { data }
}
```

Devolver una ref `error` le da al consumidor control total sobre cómo mostrar el error.

## Observar URLs reactivas

Cuando la URL depende de estado reactivo, vuelve a cargar en cada cambio y gestiona los errores para cada petición:

```ts
export function useFetchData<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    const resolvedUrl = toValue(url)
    isLoading.value = true
    error.value = null

    try {
      data.value = await $fetch<T>(resolvedUrl)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(() => toValue(url), execute, { immediate: true })

  return { data, error, isLoading, retry: execute }
}
```

```vue
<script setup>
const userId = ref(1)
const { data: user, error } =
  useFetchData < User > (() => `/api/users/${userId.value}`)
</script>
```

<PlaygroundLink code="<script setup>
const userId = ref(1)
const { data: user, error } =
  useFetchData < User > (() => `/api/users/${userId.value}`)
</script>" />

Cada vez que `userId` cambia, el composable carga la nueva URL y resetea el estado de error.

## Errores tipados para distintos tipos de fallo

Diferencia entre errores de red, errores de validación y errores de lógica de negocio:

```ts
interface FetchResult<T> {
  data: Ref<T | null>
  error: Ref<FetchError | null>
  isLoading: Ref<boolean>
  retry: () => Promise<void>
}

interface FetchError {
  message: string
  status?: number
  isNetworkError: boolean
  isValidationError: boolean
}

function toFetchError(e: unknown): FetchError {
  if (e instanceof Response || (e && typeof e === 'object' && 'status' in e)) {
    const status = (e as any).status
    return {
      message: `Request failed with status ${status}`,
      status,
      isNetworkError: false,
      isValidationError: status === 422
    }
  }

  return {
    message: e instanceof Error ? e.message : String(e),
    isNetworkError: true,
    isValidationError: false
  }
}
```

```vue
<template>
  <div v-if="error?.isNetworkError">
    Check your connection.
    <button @click="retry">Retry</button>
  </div>
  <div v-else-if="error?.isValidationError">
    The submitted data was invalid.
  </div>
  <div v-else-if="error">Something went wrong: {{ error.message }}</div>
</template>
```

<PlaygroundLink code="<template>
  <div v-if=&quot;error?.isNetworkError&quot;>
    Check your connection.
    <button @click=&quot;retry&quot;>Retry</button>
  </div>
  <div v-else-if=&quot;error?.isValidationError&quot;>
    The submitted data was invalid.
  </div>
  <div v-else-if=&quot;error&quot;>Something went wrong: {{ error.message }}</div>
</template>" />

## Gestión global de errores con onErrorCaptured

Para errores que los composables no pueden gestionar (errores de ejecución inesperados), usa `onErrorCaptured` en un componente padre:

```vue
<!-- ErrorBoundary.vue -->
<script setup>
const error = (ref < Error) | (null > null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <div v-if="error">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="error = null">Dismiss</button>
  </div>
  <slot v-else />
</template>
```

<PlaygroundLink code="<script setup>
const error = (ref < Error) | (null > null)
&#10;onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>
&#10;<template>
  <div v-if=&quot;error&quot;>
    <p>Something went wrong: {{ error.message }}</p>
    <button @click=&quot;error = null&quot;>Dismiss</button>
  </div>
  <slot v-else />
</template>" />

```vue
<!-- Uso -->
<ErrorBoundary>
  <UserProfile :user-id="1" />
</ErrorBoundary>
```

<PlaygroundLink code="<ErrorBoundary>
  <UserProfile :user-id=&quot;1&quot; />
</ErrorBoundary>" />

Esto captura errores de componentes descendientes lanzados durante: renders, watchers, lifecycle hooks, manejadores de eventos, `setup()`, hooks de directivas personalizadas y hooks de transiciones. Evita que toda la aplicacion falle.

## Lista de comprobación

| Práctica                                       | Por qué                                                   |
| ---------------------------------------------- | --------------------------------------------------------- |
| Devuelve ref `error`, no lances excepciones    | El consumidor controla el renderizado del error           |
| Resetea el error antes de cada petición        | Los errores obsoletos no persisten entre reintentos       |
| Expone una función `retry`                     | Permite a los usuarios recuperarse de fallos transitorios |
| Tipifica los errores por categoría             | Diferentes errores necesitan diferente UI                 |
| Usa `onErrorCaptured` para errores inesperados | Evita fallos totales de la aplicación                     |

Ver también: [¿Cómo construirías un composable para data fetching?](/es/q/composable-data-fetching) · [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cómo funciona el manejo de errores en Vue?](/es/q/error-handling)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
