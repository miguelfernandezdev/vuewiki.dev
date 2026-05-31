---
order: 8
title: "What is a composable?"
difficulty: "beginner"
---

A function that encapsulates reusable logic using the Composition API. Equivalent to React **custom hooks**. Convention: name starts with `use`.

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() { count.value++ }
  function reset() { count.value = initial }

  return { count, doubled, increment, reset }
}
```

```vue
<!-- Usage in a component -->
<script setup>
import { useCounter } from '@/composables/useCounter'
const { count, doubled, increment } = useCounter(10)
</script>
```
