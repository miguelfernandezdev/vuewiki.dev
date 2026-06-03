---
order: 93
title: '¿Qué es VueUse y cuáles son sus composables más útiles?'
difficulty: 'intermediate'
tags: ['composables', 'tooling', 'pinia', 'vueuse', 'watchers', 'v-model']
summary: 'Una colección de 200+ composables para tareas comunes: APIs del navegador, sensores, estado, red. Instala @vueuse/core y úsalos directamente.'
---

VueUse es una colección de composables para tareas comunes: APIs del navegador, sensores, estado, animaciones, red y más. En lugar de escribir tu propio `useLocalStorage` o `useDebounceFn` desde cero, instalas `@vueuse/core` y obtienes más de 200 composables probados que funcionan con el sistema de reactividad de Vue 3.

```bash
npm install @vueuse/core
```

## Composables más útiles por categoría

### Navegador y DOM

**useLocalStorage / useSessionStorage**: almacenamiento reactivo que se sincroniza automáticamente.

```ts
const theme = useLocalStorage('theme', 'light')
theme.value = 'dark' // guardado en localStorage inmediatamente
```

**useClipboard**: copiar al portapapeles.

```ts
const { copy, copied } = useClipboard()
await copy('Hello!')
// copied.value es true durante 1,5 segundos
```

**useMediaQuery**: media query CSS reactiva.

```ts
const isMobile = useMediaQuery('(max-width: 768px)')
```

**useDark**: modo oscuro con persistencia.

```ts
const isDark = useDark()
const toggle = useToggle(isDark)
```

**useEventListener**: event listeners con limpieza automática.

```ts
useEventListener(window, 'resize', () => {
  console.log(window.innerWidth)
})
// el listener se elimina automáticamente cuando el componente se desmonta
```

### Estado

**useToggle**: alternado booleano.

```ts
const [value, toggle] = useToggle(false)
toggle() // true
toggle() // false
```

**useDebounceFn / useThrottleFn**: debounce y throttle.

```ts
const search = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)
```

**createGlobalState**: estado compartido entre componentes sin Pinia.

```ts
const useGlobalCounter = createGlobalState(() => {
  const count = ref(0)
  return { count }
})
```

### Red

**useFetch**: wrapper reactivo de fetch (distinto del useFetch de Nuxt).

```ts
const { data, error, isFetching } = useFetch('https://api.example.com/posts')
  .get()
  .json<Post[]>()
```

**useWebSocket**: conexión WebSocket reactiva.

```ts
const { data, send, status } = useWebSocket('wss://example.com/ws')

watch(data, (message) => {
  console.log('Received:', message)
})
```

### Sensores

**useMouse**: posición del ratón reactiva.

```ts
const { x, y } = useMouse()
```

**useIntersectionObserver**: detecta la visibilidad de un elemento.

```ts
const target = ref<HTMLElement>()
const isVisible = ref(false)

useIntersectionObserver(target, ([entry]) => {
  isVisible.value = entry.isIntersecting
})
```

**useElementSize**: dimensiones reactivas de un elemento.

```ts
const el = ref<HTMLElement>()
const { width, height } = useElementSize(el)
```

### Utilidades

**watchDebounced**: watcher con debounce.

```ts
const search = ref('')

watchDebounced(
  search,
  (value) => {
    fetchResults(value)
  },
  { debounce: 300 }
)
```

**whenever**: watch que se ejecuta solo cuando el valor es truthy.

```ts
const isReady = ref(false)

whenever(isReady, () => {
  console.log('Ready!')
})
```

**useAsyncState**: ejecuta una función asíncrona con estado reactivo de carga/error.

```ts
const { state, isLoading, error } = useAsyncState(
  () => fetch('/api/user').then((r) => r.json()),
  null // estado inicial
)
```

## Uso en un componente real

```vue
<script setup>
import { useLocalStorage, useDebounceFn, useMediaQuery } from '@vueuse/core'

const searchQuery = useLocalStorage('search', '')
const isMobile = useMediaQuery('(max-width: 768px)')

const debouncedSearch = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)

watch(searchQuery, (q) => debouncedSearch(q))
</script>

<template>
  <input
    v-model="searchQuery"
    :placeholder="isMobile ? 'Search...' : 'Search articles...'"
  />
</template>
```

<PlaygroundLink code="<script setup>
import { useLocalStorage, useDebounceFn, useMediaQuery } from '@vueuse/core'
&#10;const searchQuery = useLocalStorage('search', '')
const isMobile = useMediaQuery('(max-width: 768px)')
&#10;const debouncedSearch = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)
&#10;watch(searchQuery, (q) => debouncedSearch(q))
</script>
&#10;<template>
  <input
    v-model=&quot;searchQuery&quot;
    :placeholder=&quot;isMobile ? 'Search...' : 'Search articles...'&quot;
  />
</template>" />

</template>" />

## VueUse frente a escribir el tuyo propio

Escribe tu propio composable cuando la lógica es específica de tu dominio. Usa VueUse cuando el problema es genérico: debounce, almacenamiento, media queries, portapapeles, intersection observer. Los composables de VueUse gestionan casos borde, compatibilidad con SSR y limpieza que de otro modo tendrías que implementar tú mismo.

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cómo construirías un composable para data fetching?](/es/q/composable-data-fetching) · [¿Cómo implementar debounce?](/es/q/debounce-search-input)

## Referencias

- [VueUse](https://vueuse.org/) - VueUse docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
