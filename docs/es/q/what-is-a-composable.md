---
order: 8
title: "¿Qué es un composable?"
difficulty: "beginner"
tags: ["composables", "composition-api"]
---

Una función que encapsula lógica reutilizable usando la Composition API. Es el equivalente a los **custom hooks** de React. Convención: el nombre empieza por `use`.

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
<!-- Uso en un componente -->
<script setup>
import { useCounter } from '@/composables/useCounter'
const { count, doubled, increment } = useCounter(10)
</script>
```
