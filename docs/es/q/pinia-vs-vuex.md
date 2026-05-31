---
order: 9
title: "¿Qué es Pinia y en qué se diferencia de Vuex?"
difficulty: "beginner"
tags: ["state-management"]
---

**Pinia** es el store oficial de Vue 3 (reemplaza a Vuex). Diferencias clave:

| | Vuex | Pinia |
|---|---|---|
| Mutations | Sí (obligatorias) | No existen |
| TypeScript | Soporte limitado | Soporte nativo |
| Stores | Módulos dentro de 1 store | Stores independientes |
| Sintaxis | Options o Setup | Options o Setup |
| DevTools | Sí | Sí |
| Composición | Compleja (módulos con namespace) | Simple (importar y usar) |

```ts
// Store de Pinia
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
