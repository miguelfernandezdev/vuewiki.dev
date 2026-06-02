---
order: 151
title: "What is the difference between useFetch, useAsyncData, and $fetch?"
difficulty: "intermediate"
tags: ["nuxt", "data-fetching", "vueuse"]
---

Nuxt provides three ways to fetch data. Each solves a different problem around SSR, hydration, and double-fetching.

## $fetch

A thin wrapper around the Fetch API (powered by `ofetch`). Use it for client-side events like form submissions or button clicks.

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

**Do not** use `$fetch` alone in `setup` for initial data. It runs on the server AND on the client, fetching twice.

## useFetch

The primary composable for component data. It wraps `$fetch` with SSR awareness: the data fetched on the server is serialized into the HTML payload, so the client doesn't fetch again during hydration.

```vue
<script setup>
const { data, status, error, refresh } = await useFetch('/api/posts')
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="post in data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

### Reactive parameters

Pass refs as query params or use a computed URL. `useFetch` automatically refetches when they change:

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

### Key options

```ts
const { data } = await useFetch('/api/posts', {
  pick: ['id', 'title'],           // only keep these fields in the payload
  transform: (posts) => posts.slice(0, 5), // transform before caching
  default: () => [],                // default value while loading
  lazy: true,                       // don't block navigation
  server: false,                    // skip server-side fetch
  immediate: false,                 // don't fetch until you call execute()
})
```

## useAsyncData

Like `useFetch`, but wraps any async function instead of just `$fetch`. Use it when your data comes from a custom source or when you need to combine multiple requests:

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

The first argument is a unique key for caching and deduplication.

## When to use which

| Scenario | Use |
|---|---|
| Fetch from an API endpoint in a component | `useFetch` |
| Combine multiple fetches into one | `useAsyncData` with `Promise.all` |
| Fetch from a non-HTTP source (database, SDK) | `useAsyncData` |
| Button click, form submit, user action | `$fetch` |
| Initial data in `setup` | `useFetch` or `useAsyncData`, never `$fetch` alone |

## Shared return values

All composables return the same shape:

| Property | Type | Description |
|---|---|---|
| `data` | `Ref<T>` | The fetched data |
| `error` | `Ref<Error \| null>` | Error if the request failed |
| `status` | `Ref<'idle' \| 'pending' \| 'success' \| 'error'>` | Current state |
| `refresh` | `() => Promise` | Refetch the data |
| `clear` | `() => void` | Reset data and error |

## Sharing data across components

```vue
<!-- Component A: fetches and caches -->
<script setup>
const { data } = await useFetch('/api/user', { key: 'current-user' })
</script>

<!-- Component B: reads from cache, no extra request -->
<script setup>
const { data } = useNuxtData('current-user')
</script>
```

Refresh cached data from anywhere:

```ts
await refreshNuxtData('current-user')
```

See also: [How does the SSR payload work in Nuxt?](/q/nuxt-payload) · [What happens if you call useFetch inside an event handler?](/q/nuxt-usefetch-event-handler) · [How do Nitro server routes work?](/q/nuxt-nitro-server-routes)

## References

- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) - Nuxt docs
- [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) - Nuxt docs
