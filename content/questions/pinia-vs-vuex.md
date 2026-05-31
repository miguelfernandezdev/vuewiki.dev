---
order: 9
title: "What is Pinia and how does it differ from Vuex?"
difficulty: "beginner"
---

**Pinia** is the official store for Vue 3 (replaces Vuex). Key differences:

| | Vuex | Pinia |
|---|---|---|
| Mutations | Yes (required) | Don't exist |
| TypeScript | Limited support | Native support |
| Stores | Modules inside 1 store | Independent stores |
| Syntax | Options or Setup | Options or Setup |
| DevTools | Yes | Yes |
| Composition | Complex (namespaced modules) | Simple (import and use) |

```ts
// Pinia store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0))

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  return { items, total, addItem }
})
```
