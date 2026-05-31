---
order: 17
title: "¿Cómo implementarías debounce en un campo de búsqueda?"
difficulty: "intermediate"
tags: ["composables", "performance"]
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

**Como composable reutilizable:**
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
