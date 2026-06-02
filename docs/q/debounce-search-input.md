---
order: 92
title: "How would you implement debounce on a search input?"
difficulty: "intermediate"
tags: ["composables", "performance", "vueuse", "watchers", "v-model"]
---

Debouncing delays an action until the user stops typing for a set amount of time. Without it, a search input fires an API call on every keystroke — typing "vue router" sends 10 requests, most of which are useless because the user hasn't finished typing.

## Inline approach

The simplest way: watch the input value and delay updating the actual query:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const searchQuery = ref('')
const debouncedQuery = ref('')

let timeout: ReturnType<typeof setTimeout>

watch(searchQuery, (newVal) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    debouncedQuery.value = newVal
  }, 300)
})
</script>

<template>
  <input v-model="searchQuery" placeholder="Search..." />
  <SearchResults :query="debouncedQuery" />
</template>
```

The user types into `searchQuery` (instant feedback). After 300ms of no typing, `debouncedQuery` updates and triggers the actual search. Each new keystroke resets the timer.

## Extract a reusable composable

If you debounce in multiple places, extract the pattern:

```ts
import { ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(source, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = val
    }, delay)
  })

  return debounced
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDebouncedRef } from '@/composables/useDebouncedRef'

const searchQuery = ref('')
const debouncedQuery = useDebouncedRef(searchQuery, 300)
</script>

<template>
  <input v-model="searchQuery" placeholder="Search..." />
  <SearchResults :query="debouncedQuery" />
</template>
```

## Using VueUse

[VueUse](https://vueuse.org/) has [`refDebounced`](https://vueuse.org/shared/refDebounced/) (same idea, battle-tested) and [`useDebounceFn`](https://vueuse.org/shared/useDebounceFn/) (debounces any function):

```ts
import { ref } from 'vue'
import { refDebounced } from '@vueuse/core'

const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 300)
```

## Debounce vs throttle

**Debounce** waits until activity stops (fires once after the last event). **Throttle** fires at regular intervals during activity (at most once per interval). For search inputs, debounce is usually the right choice — you want to wait until the user finishes typing. For scroll or resize handlers, throttle is often better because you want periodic updates while the event is happening.

See also: [What is VueUse?](/q/vueuse) · [How would you build a composable for data fetching?](/q/composable-data-fetching) · [What is a composable?](/q/what-is-a-composable)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [refDebounced](https://vueuse.org/shared/refDebounced/) - VueUse docs
- [useDebounceFn](https://vueuse.org/shared/useDebounceFn/) - VueUse docs
