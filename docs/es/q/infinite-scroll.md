---
order: 120
title: '¿Cómo implementarías el scroll infinito con Vue?'
difficulty: 'intermediate'
tags: ['performance', 'composables', 'vueuse', 'watchers']
summary: 'Usa IntersectionObserver en un elemento centinela al final de la lista. Cuando entra en el viewport, carga la siguiente página.'
---

El scroll infinito carga más contenido a medida que el usuario se desplaza cerca del fondo de la página. El enfoque estándar usa `IntersectionObserver` sobre un elemento centinela al final de la lista. Cuando el centinela entra en el viewport, se obtiene la siguiente página.

## Implementación básica

```vue
<script setup lang="ts">
interface Post {
  id: number
  title: string
}

const posts = ref<Post[]>([])
const page = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)

async function loadMore() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true
  const newPosts = await $fetch<Post[]>('/api/posts', {
    params: { page: page.value, limit: 20 }
  })

  posts.value.push(...newPosts)
  hasMore.value = newPosts.length === 20
  page.value++
  isLoading.value = false
}

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadMore()
    },
    { rootMargin: '200px' }
  )

  watchEffect(() => {
    if (sentinel.value) observer.observe(sentinel.value)
  })

  onUnmounted(() => observer.disconnect())
})

loadMore()
</script>

<template>
  <div>
    <div v-for="post in posts" :key="post.id" class="post">
      <h3>{{ post.title }}</h3>
    </div>

    <div ref="sentinel" />

    <p v-if="isLoading">Cargando...</p>
    <p v-if="!hasMore">No hay más publicaciones.</p>
  </div>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
interface Post {
id: number
title: string
}
&#10;const posts = ref<Post[]>([])
const page = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
&#10;async function loadMore() {
if (isLoading.value || !hasMore.value) return
&#10; isLoading.value = true
const newPosts = await $fetch<Post[]>('/api/posts', {
params: { page: page.value, limit: 20 }
})
&#10; posts.value.push(...newPosts)
hasMore.value = newPosts.length === 20
page.value++
isLoading.value = false
}
&#10;onMounted(() => {
const observer = new IntersectionObserver(
([entry]) => {
if (entry.isIntersecting) loadMore()
},
{ rootMargin: '200px' }
)
&#10; watchEffect(() => {
if (sentinel.value) observer.observe(sentinel.value)
})
&#10; onUnmounted(() => observer.disconnect())
})
&#10;loadMore()
</script>
&#10;<template>

  <div>
    <div v-for=&quot;post in posts&quot; :key=&quot;post.id&quot; class=&quot;post&quot;>
      <h3>{{ post.title }}</h3>
    </div>
&#10;    <div ref=&quot;sentinel&quot; />
&#10;    <p v-if=&quot;isLoading&quot;>Cargando...</p>
    <p v-if=&quot;!hasMore&quot;>No hay más publicaciones.</p>
  </div>
</template>" />

El `rootMargin: '200px'` activa la carga 200px antes de que el centinela sea visible, de modo que el contenido aparece antes de que el usuario llegue al fondo.

## Versión con composable

Extrae la lógica para que cualquier lista pueda usarla:

```ts
// composables/useInfiniteScroll.ts
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<T[]>,
  options: { pageSize?: number; rootMargin?: string } = {}
) {
  const { pageSize = 20, rootMargin = '200px' } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const page = ref(1)
  const isLoading = ref(false)
  const hasMore = ref(true)
  const sentinel = ref<HTMLElement | null>(null)

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    isLoading.value = true

    const newItems = await fetchFn(page.value)
    items.value.push(...newItems)
    hasMore.value = newItems.length === pageSize
    page.value++
    isLoading.value = false
  }

  function reset() {
    items.value = []
    page.value = 1
    hasMore.value = true
    loadMore()
  }

  onMounted(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin }
    )

    watchEffect(() => {
      if (sentinel.value) observer.observe(sentinel.value)
    })

    onUnmounted(() => observer.disconnect())
  })

  loadMore()

  return { items, isLoading, hasMore, sentinel, reset }
}
```

```vue
<script setup>
const {
  items: posts,
  isLoading,
  hasMore,
  sentinel
} = useInfiniteScroll((page) =>
  $fetch('/api/posts', { params: { page, limit: 20 } })
)
</script>

<template>
  <div v-for="post in posts" :key="post.id">{{ post.title }}</div>
  <div ref="sentinel" />
  <p v-if="isLoading">Cargando...</p>
  <p v-if="!hasMore">Fin de la lista.</p>
</template>
```

<PlaygroundLink code="<script setup>
const {
items: posts,
isLoading,
hasMore,
sentinel
} = useInfiniteScroll((page) =>
$fetch('/api/posts', { params: { page, limit: 20 } })
)
</script>
&#10;<template>

  <div v-for=&quot;post in posts&quot; :key=&quot;post.id&quot;>{{ post.title }}</div>
  <div ref=&quot;sentinel&quot; />
  <p v-if=&quot;isLoading&quot;>Cargando...</p>
  <p v-if=&quot;!hasMore&quot;>Fin de la lista.</p>
</template>" />

## Con VueUse

VueUse proporciona `useIntersectionObserver` que simplifica la configuración del observer:

```vue
<script setup>
import { useIntersectionObserver } from '@vueuse/core'

const sentinel = (ref < HTMLElement) | (null > null)

useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry.isIntersecting) loadMore()
  },
  { rootMargin: '200px' }
)
</script>
```

<PlaygroundLink code="<script setup>
import { useIntersectionObserver } from '@vueuse/core'
&#10;const sentinel = (ref < HTMLElement) | (null > null)
&#10;useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry.isIntersecting) loadMore()
  },
  { rootMargin: '200px' }
)
</script>" />

## Paginación basada en cursor

Para APIs que usan cursores en lugar de números de página:

```ts
const cursor = ref<string | null>(null)

async function loadMore() {
  if (isLoading.value || !hasMore.value) return
  isLoading.value = true

  const response = await $fetch('/api/posts', {
    params: { cursor: cursor.value, limit: 20 }
  })

  posts.value.push(...response.data)
  cursor.value = response.nextCursor
  hasMore.value = !!response.nextCursor
  isLoading.value = false
}
```

## Combinado con virtualización de listas

Para listas muy largas (miles de elementos), el scroll infinito por sí solo causa problemas de rendimiento porque todos los elementos cargados permanecen en el DOM. Combínalo con una lista virtualizada:

```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const { items, isLoading, hasMore, sentinel } = useInfiniteScroll(fetchPosts)

const { list, containerProps, wrapperProps } = useVirtualList(items, {
  itemHeight: 80
})
</script>

<template>
  <div v-bind="containerProps" style="height: 600px; overflow-y: auto">
    <div v-bind="wrapperProps">
      <div v-for="{ data, index } in list" :key="data.id" style="height: 80px">
        {{ data.title }}
      </div>
    </div>
    <div ref="sentinel" />
  </div>
</template>
```

<PlaygroundLink code="<script setup>
import { useVirtualList } from '@vueuse/core'
&#10;const { items, isLoading, hasMore, sentinel } = useInfiniteScroll(fetchPosts)
&#10;const { list, containerProps, wrapperProps } = useVirtualList(items, {
itemHeight: 80
})
</script>
&#10;<template>

  <div v-bind=&quot;containerProps&quot; style=&quot;height: 600px; overflow-y: auto&quot;>
    <div v-bind=&quot;wrapperProps&quot;>
      <div v-for=&quot;{ data, index } in list&quot; :key=&quot;data.id&quot; style=&quot;height: 80px&quot;>
        {{ data.title }}
      </div>
    </div>
    <div ref=&quot;sentinel&quot; />
  </div>
</template>" />

Así cargas datos de forma incremental Y solo renderizas los elementos visibles.

## Scroll infinito vs paginación

|             | Scroll infinito                               | Paginación                              |
| ----------- | --------------------------------------------- | --------------------------------------- |
| UX          | Navegación continua                           | Control explícito de página             |
| Botón atrás | Pierde la posición de scroll                  | Fácil volver a una página               |
| SEO         | Más difícil (contenido no en el HTML inicial) | Cada página tiene una URL               |
| Rendimiento | Riesgo de DOM grande con el tiempo            | Tamaño de DOM constante                 |
| Ideal para  | Feeds sociales, galerías de imágenes          | Resultados de búsqueda, tablas de datos |

Ver también: [¿Cómo funcionan las template refs?](/es/q/template-refs) · [¿Qué es VueUse?](/es/q/vueuse)

## Referencias

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [useIntersectionObserver](https://vueuse.org/core/useIntersectionObserver/) - VueUse docs
