---
order: 8
title: "What is a composable?"
difficulty: "beginner"
tags: ["composables", "composition-api"]
---

A function that encapsulates reusable logic using the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html). Equivalent to React **custom hooks**. Convention: name starts with `use`.

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

See also: [What are higher-order components (HOC) equivalent in Vue?](/q/hoc-equivalents-vue) · [What is the Composition API and how does it differ from the Options API?](/q/composition-api-vs-options-api)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [ref](https://vuejs.org/api/reactivity-core.html#ref) - Vue.js docs
