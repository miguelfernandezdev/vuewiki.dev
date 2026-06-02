---
order: 120
title: "How would you implement infinite scroll with Vue?"
difficulty: "intermediate"
tags: ["performance", "composables", "vueuse", "watchers"]
---

Infinite scroll loads more content as the user scrolls near the bottom of the page. The standard approach uses `IntersectionObserver` on a sentinel element at the end of the list. When the sentinel enters the viewport, you fetch the next page.

## Basic implementation

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

    <p v-if="isLoading">Loading...</p>
    <p v-if="!hasMore">No more posts.</p>
  </div>
</template>
```

The `rootMargin: '200px'` triggers the load 200px before the sentinel is visible, so content appears before the user reaches the bottom.

## Composable version

Extract the logic so any list can use it:

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
const { items: posts, isLoading, hasMore, sentinel } = useInfiniteScroll(
  (page) => $fetch('/api/posts', { params: { page, limit: 20 } })
)
</script>

<template>
  <div v-for="post in posts" :key="post.id">{{ post.title }}</div>
  <div ref="sentinel" />
  <p v-if="isLoading">Loading...</p>
  <p v-if="!hasMore">End of list.</p>
</template>
```

## With VueUse

VueUse provides `useIntersectionObserver` which simplifies the observer setup:

```vue
<script setup>
import { useIntersectionObserver } from '@vueuse/core'

const sentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (entry.isIntersecting) loadMore()
  },
  { rootMargin: '200px' }
)
</script>
```

## Cursor-based pagination

For APIs that use cursors instead of page numbers:

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

## Combining with list virtualization

For very long lists (thousands of items), infinite scroll alone causes performance issues because all loaded items stay in the DOM. Combine it with a virtualized list:

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

This way you load data incrementally AND only render visible items.

## Infinite scroll vs pagination

| | Infinite scroll | Pagination |
|---|---|---|
| UX | Seamless browsing | Explicit page control |
| Back button | Loses scroll position | Easy to return to a page |
| SEO | Harder (content not in initial HTML) | Each page is a URL |
| Performance | Risk of large DOM over time | Constant DOM size |
| Best for | Social feeds, image galleries | Search results, data tables |

See also: [How do template refs work?](/q/template-refs) · [What is VueUse?](/q/vueuse)

## References

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [useIntersectionObserver](https://vueuse.org/core/useIntersectionObserver/) - VueUse docs
