---
order: 94
title: 'How do you cancel an API request in a composable?'
difficulty: 'intermediate'
tags: ['composables', 'vueuse', 'watchers', 'v-model']
summary: 'Create an AbortController, pass its signal to fetch, and call abort() on unmount or when a new request replaces a stale one.'
---

Use the browser's `AbortController` API. Create a controller, pass its `signal` to `fetch`, and call `controller.abort()` when you need to cancel. In Vue, the two most common triggers for cancellation are component unmount (prevent state updates on destroyed components) and new requests replacing stale ones (race condition prevention).

## AbortController basics

```js
const controller = new AbortController()

fetch('/api/users', { signal: controller.signal })
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === 'AbortError') {
      console.log('Request was cancelled')
    }
  })

// Cancel the request
controller.abort()
```

Calling `abort()` rejects the fetch promise with an `AbortError`. You check `err.name` to distinguish cancellations from real errors.

## Cancel on unmount

When a component unmounts while a request is in flight, the response arrives after the component is destroyed. Setting state on a destroyed component is a memory leak and can cause warnings.

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
// If the component unmounts, the request is cancelled automatically
</script>
```

<PlaygroundLink code="<script setup>
const { data: users, isLoading } = useFetch<User[]>('/api/users')
// If the component unmounts, the request is cancelled automatically
</script>" />

The `onUnmounted` hook aborts any in-flight request. The `AbortError` catch ensures the error state stays clean.

## Cancel stale requests (race condition)

When the URL changes quickly (search-as-you-type), multiple requests can be in flight at once. Without cancellation, the results can arrive out of order:

```
User types: "v" → "vu" → "vue"
Request 1: /api/search?q=v    (sent first)
Request 2: /api/search?q=vu   (sent second)
Request 3: /api/search?q=vue  (sent third)

Response order: Request 2, Request 3, Request 1
Result displayed: "v" results (wrong!)
```

The composable above already handles this. Each call to `execute` aborts the previous controller before creating a new one:

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

<PlaygroundLink code="<script setup>
const query = ref('')
const searchUrl = computed(() => `/api/search?q=${query.value}`)
&#10;const { data: results, isLoading } = useFetch(searchUrl)
</script>
&#10;<template>
<input v-model=&quot;query&quot; placeholder=&quot;Search...&quot; />

  <ul v-if=&quot;results&quot;>
    <li v-for=&quot;item in results&quot; :key=&quot;item.id&quot;>{{ item.name }}</li>
  </ul>
</template>" />

When `query` changes from "vu" to "vue", the watcher fires `execute`, which aborts the "vu" request and starts the "vue" request. Only the last result arrives.

## With axios

Axios supports `AbortController` the same way:

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
        // handle real errors
      }
    }
  }

  watch(() => toValue(url), execute, { immediate: true })
  onUnmounted(() => controller?.abort())

  return { data, execute }
}
```

Axios provides `axios.isCancel(e)` as a cleaner check than comparing `error.name`.

## Timeout with AbortSignal.timeout

For requests that should fail after a time limit, use `AbortSignal.timeout` (available in modern browsers):

```ts
async function execute() {
  controller?.abort()
  controller = new AbortController()

  const timeoutSignal = AbortSignal.timeout(5000)
  const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal])

  const response = await fetch(toValue(url), {
    signal: combinedSignal
  })
  // ...
}
```

`AbortSignal.any` combines multiple signals. The request cancels if either the component unmounts (manual abort) or 5 seconds pass (timeout).

## Nuxt's built-in cancellation

Nuxt's `useFetch` and `useAsyncData` handle cancellation automatically. When the component unmounts or the watched params change, Nuxt aborts the previous request:

```vue
<script setup>
const query = ref('')

const { data: results } = useFetch('/api/search', {
  query: { q: query }
})
// Nuxt cancels stale requests and cleans up on unmount
</script>
```

<PlaygroundLink code="<script setup>
const query = ref('')
&#10;const { data: results } = useFetch('/api/search', {
  query: { q: query }
})
// Nuxt cancels stale requests and cleans up on unmount
</script>" />

No manual `AbortController` needed. This is one of the reasons to prefer Nuxt's data fetching over raw `fetch` in Nuxt apps.

## When to cancel

| Scenario             | Why cancel                                        |
| -------------------- | ------------------------------------------------- |
| Component unmounts   | Prevent state updates on destroyed component      |
| Search input changes | Prevent stale results from overwriting fresh ones |
| Route navigation     | Stop fetching data for a page the user left       |
| Timeout              | Fail fast instead of waiting indefinitely         |
| User clicks "cancel" | Respect explicit user intent                      |

See also: [How would you build a composable for data fetching?](/q/composable-data-fetching) · [What is a composable?](/q/what-is-a-composable) · [How do async composables handle errors and loading state?](/q/async-composable-error-handling)

## References

- [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - MDN
- [AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - MDN
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
