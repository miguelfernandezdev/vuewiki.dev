---
order: 91
title: 'How would you build a composable for data fetching?'
difficulty: 'intermediate'
tags: ['composables', 'pinia', 'vueuse', 'watchers']
summary: 'Wrap loading, error, and data refs with the fetch logic in a function. Return reactive state so the component just reads values.'
---

Data fetching is one of the first things you'll extract into a [composable](/q/what-is-a-composable). Every component that loads data from an API repeats the same pattern: a loading flag, an error state, the actual data, and the fetch logic. A `useFetch` composable wraps all of that into a reusable function.

## Basic implementation

```ts
import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    execute()
  })

  return { data, error, loading, refetch: execute }
}
```

Key design decisions:

- **`MaybeRefOrGetter<string>`**: the URL can be a plain string, a ref, or a getter. [`toValue()`](https://vuejs.org/api/reactivity-utilities.html#tovalue) unwraps whatever it is. This is the Vue 3.3+ convention for composable inputs.
- **`watchEffect`**: runs immediately (fetches on creation) and re-runs whenever the URL changes. If the URL is static, it fetches once.
- **Returns refs**: the caller gets reactive `data`, `error`, and `loading` that update as the request progresses.
- **`refetch`**: exposes the execute function so the caller can retry or refresh manually.

## Using it in a component

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useFetch } from '@/composables/useFetch'

const props = defineProps<{ userId: number }>()

const {
  data: user,
  error,
  loading
} = useFetch<User>(() => `/api/users/${props.userId}`)
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else-if="user">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
  </div>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { computed } from 'vue'
import { useFetch } from '@/composables/useFetch'
&#10;const props = defineProps<{ userId: number }>()
&#10;const {
  data: user,
  error,
  loading
} = useFetch<User>(() => `/api/users/${props.userId}`)
</script>
&#10;<template>
  <div v-if=&quot;loading&quot;>Loading...</div>
  <div v-else-if=&quot;error&quot;>Error: {{ error }}</div>
  <div v-else-if=&quot;user&quot;>
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
  </div>
</template>" />

Passing a getter (`() => /api/users/${props.userId}`) means the composable refetches automatically when `userId` changes.

## What about AbortController?

A production composable should cancel in-flight requests when the URL changes or the component unmounts. See [How do you use AbortController in a composable?](/q/abort-controller-composable) for that pattern.

## When to use a library instead

For real apps, consider [VueUse's `useFetch`](https://vueuse.org/core/useFetch/) or dedicated data-fetching libraries like [Pinia Colada](https://pinia-colada.esm.dev/) or [TanStack Query](https://tanstack.com/query/latest/docs/framework/vue/overview). They handle caching, deduplication, retry logic, and stale-while-revalidate patterns that a simple composable doesn't cover.

See also: [What is a composable?](/q/what-is-a-composable) · [How do you use AbortController in a composable?](/q/abort-controller-composable) · [What is VueUse?](/q/vueuse)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Async State Example](https://vuejs.org/guide/reusability/composables.html#async-state-example) - Vue.js docs
- [toValue()](https://vuejs.org/api/reactivity-utilities.html#tovalue) - Vue.js docs
