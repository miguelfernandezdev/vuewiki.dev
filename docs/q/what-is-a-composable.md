---
order: 90
title: "What is a composable?"
difficulty: "beginner"
tags: ["composables", "composition-api", "vueuse", "watchers"]
summary: "A function that encapsulates reusable logic using the Composition API (refs, computed, watchers). It returns reactive state and methods."
---

As your components grow, you'll notice pieces of logic that don't belong to any single component: data fetching patterns, form validation, timers, event listeners. A composable is a function that packages that reusable logic using the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html), so you can share it across components without duplicating code.

## The problem composables solve

Imagine two components that both need a counter with increment, decrement, and reset. Without composables, you'd copy-paste the same `ref` + functions into both components. When you need to change the behavior, you'd have to update both places.

A composable extracts that logic into a function:

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initial }

  return { count, doubled, increment, decrement, reset }
}
```

```vue
<!-- Any component that needs a counter -->
<script setup>
import { useCounter } from '@/composables/useCounter'

const { count, increment, reset } = useCounter(10)
</script>

<template>
  <p>{{ count }}</p>
  <button @click="increment">+</button>
  <button @click="reset">Reset</button>
</template>
```

Each component that calls `useCounter()` gets its own independent instance. They don't share state unless you explicitly design the composable to do so.

## A real-world example: useFetch

Composables shine for patterns you repeat everywhere, like fetching data:

```ts
// composables/useFetch.ts
import { ref, watchEffect } from 'vue'

export function useFetch<T>(url: () => string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  watchEffect(async () => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url())
      data.value = await res.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}
```

```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

const { data: users, loading, error } = useFetch<User[]>(() => '/api/users')
</script>
```

Now every component that fetches data gets loading state, error handling, and reactive URL tracking for free.

## Conventions

- **Name starts with `use`**: `useCounter`, `useFetch`, `useAuth`. This signals that the function uses reactive state and should be called inside `setup`.
- **Return an object**: return named properties so callers can destructure what they need.
- **Accept refs or getters as inputs**: this makes composables reactive to changing inputs.
- **Keep them focused**: one composable = one concern. Don't bundle unrelated logic.

## Composables vs mixins

Composables replace Vue 2's mixins. Mixins had serious issues: property name collisions, unclear data sources, and implicit dependencies. Composables solve all three because everything is explicitly imported and returned.

See also: [What are higher-order components (HOC) equivalent in Vue?](/q/hoc-equivalents-vue) · [What is the Composition API?](/q/composition-api-vs-options-api)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
