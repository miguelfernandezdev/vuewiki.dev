---
order: 8
title: "¿Qué es un composable?"
difficulty: "beginner"
tags: ["composables", "composition-api"]
---

Una función que encapsula lógica reutilizable usando la [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html). Es el equivalente a los **custom hooks** de React. Convención: el nombre empieza por `use`.

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

Ver también: [¿Cuál es el equivalente a los HOC en Vue?](/es/q/hoc-equivalents-vue) · [¿Qué es la Composition API y en qué se diferencia de la Options API?](/es/q/composition-api-vs-options-api)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [ref](https://vuejs.org/api/reactivity-core.html#ref) - Vue.js docs
