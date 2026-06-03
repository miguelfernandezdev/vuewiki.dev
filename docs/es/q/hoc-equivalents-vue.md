---
order: 60
title: '¿Cuál es el equivalente a los componentes de orden superior (HOC) en Vue?'
difficulty: 'advanced'
tags: ['composition-api', 'architecture', 'vueuse', 'watchers', 'slots']
summary: 'Vue no usa HOCs. Los composables los reemplazan para reutilizar lógica, y los componentes renderless (via slots) para patrones de lógica + renderizado.'
---

En React, un Higher-Order Component (HOC) es una función que recibe un componente y devuelve uno nuevo con comportamiento añadido. Vue no usa este patrón porque la [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) resuelve el mismo problema de forma más directa. Los equivalentes en Vue son los composables (para reutilizar lógica) y los componentes renderless (para lógica con renderizado basado en slots). Ambos evitan el anidamiento de wrappers, las colisiones de props y los problemas de depuración que causan los HOCs.

## Qué resuelven los HOCs

La necesidad central es compartir lógica entre componentes sin duplicar código. Por ejemplo, añadir el comportamiento de "cargando + error + datos" a cualquier componente que obtenga datos, o inyectar comprobaciones de permisos.

En los componentes de clase de React (antes de los hooks), los HOCs eran la única forma de hacer esto. En Vue, la Options API tenía los mixins para el mismo propósito, y tenían problemas similares: colisiones de nombres, fuentes de datos poco claras, dependencias implícitas.

## Composables: el reemplazo principal

Un composable es una función que usa las APIs de reactividad de Vue y devuelve estado reactivo. Los componentes la llaman directamente en `setup()`:

```ts
// composables/useFetch.ts
export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  watch(() => toValue(url), execute, { immediate: true })

  return { data, error, isLoading, execute }
}
```

```vue
<!-- UserList.vue -->
<script setup>
const { data: users, isLoading, error } = useFetch<User[]>('/api/users')
</script>

<template>
  <p v-if="isLoading">Cargando...</p>
  <p v-else-if="error">{{ error.message }}</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

```vue
<!-- ProductList.vue — mismo composable, componente diferente -->
<script setup>
const { data: products, isLoading } = useFetch<Product[]>('/api/products')
</script>
```

Sin componente wrapper. Sin props ocultas. Cada componente llama explícitamente a `useFetch` y decide qué hacer con el estado devuelto.

## Componentes renderless: lógica con renderizado via slot

Cuando necesitas compartir tanto lógica como estructura de template, un componente renderless proporciona la lógica a través de un scoped slot:

```vue
<!-- FetchProvider.vue -->
<script setup lang="ts" generic="T">
const props = defineProps<{ url: string }>()
const { data, error, isLoading } = useFetch<T>(props.url)
</script>

<template>
  <slot :data="data" :error="error" :is-loading="isLoading" />
</template>
```

```vue
<!-- Uso -->
<FetchProvider url="/api/users" v-slot="{ data: users, isLoading }">
  <p v-if="isLoading">Cargando...</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</FetchProvider>
```

El componente no tiene template propio. Proporciona lógica a través del slot, y el consumidor decide cómo renderizar. Es similar al patrón render props de React.

## Por qué los HOCs son problemáticos en Vue

Técnicamente puedes escribir un HOC en Vue:

```ts
import { h } from 'vue'

function withAuth(WrappedComponent) {
  return defineComponent({
    setup(props, { attrs, slots }) {
      const { isAuthenticated } = useAuth()

      return () => {
        if (!isAuthenticated.value) return h('p', 'No autorizado')
        return h(WrappedComponent, attrs, slots)
      }
    }
  })
}

const ProtectedDashboard = withAuth(Dashboard)
```

Funciona, pero tiene problemas:

```vue
<!-- El árbol de componentes muestra ProtectedDashboard > Dashboard -->
<!-- En DevTools, el wrapper oculta el componente real -->
<!-- Las props deben pasar a través del wrapper manualmente -->
<!-- TypeScript no puede inferir las props del componente envuelto -->
```

La versión con composable es más sencilla y no tiene ninguno de estos problemas:

```vue
<script setup>
const { isAuthenticated } = useAuth()
</script>

<template>
  <Dashboard v-if="isAuthenticated" />
  <p v-else>No autorizado</p>
</template>
```

## Composables vs componentes renderless vs HOCs

|                 | Composable                             | Componente renderless            | HOC                                     |
| --------------- | -------------------------------------- | -------------------------------- | --------------------------------------- |
| Reutiliza       | Solo lógica                            | Lógica + template via slot       | Lógica + envoltorio                     |
| Cómo se consume | Llamada a función en setup             | `<Component v-slot>`             | Envuelve la definición del componente   |
| Props visibles  | Valores de retorno explícitos          | Props del scoped slot            | Ocultas, se pasan de forma transparente |
| TypeScript      | Inferencia completa                    | Inferencia completa              | Inferencia pobre                        |
| DevTools        | Sin anidamiento extra                  | Un componente extra              | Un componente extra por HOC             |
| Composabilidad  | Se pueden llamar múltiples composables | El anidamiento se vuelve verboso | El anidamiento se hace profundo         |
| Idioma Vue      | Patrón principal                       | Útil para librerías              | Evitar                                  |

## Cuándo usar cada uno

**Composables** cubren el 90% de los casos de reutilización de lógica. Úsalos para obtención de datos, validación de formularios, temporizadores, listeners de eventos, APIs del navegador y gestión de estado.

**Componentes renderless** funcionan bien en librerías de componentes donde quieres proporcionar comportamiento con renderizado personalizable. Ejemplos: librerías headless UI, proveedores de tablas de datos, wrappers de campos de formulario.

**HOCs** no tienen ningún caso de uso recomendado en Vue 3. Si vienes de React y buscas un HOC, usa un composable en su lugar.

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cuál es la diferencia entre la Composition API y los React Hooks?](/es/q/composition-api-vs-react-hooks)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Components: Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
