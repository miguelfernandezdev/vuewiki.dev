---
order: 17
title: "How would you implement debounce on a search input?"
difficulty: "intermediate"
---

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

**As a reusable composable:**
```ts
import { ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 300) {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(source, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => { debounced.value = val }, delay)
  })

  return debounced
}
```
