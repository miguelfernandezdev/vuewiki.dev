---
order: 28
title: "¿Cómo migrarías un módulo de Vuex a Pinia?"
difficulty: "advanced"
tags: ["state-management", "migration"]
---

```ts
// ANTES: Módulo de Vuex
const cartModule = {
  state: () => ({ items: [], total: 0 }),
  getters: {
    itemCount: (state) => state.items.length
  },
  mutations: {
    ADD_ITEM(state, item) {
      state.items.push(item)
      state.total += item.price
    }
  },
  actions: {
    async checkout({ state, commit }) {
      await api.checkout(state.items)
    }
  }
}

// DESPUÉS: Store de Pinia
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0))
  const itemCount = computed(() => items.value.length)

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  async function checkout() {
    await api.checkout(items.value)
  }

  return { items, total, itemCount, addItem, checkout }
})
```

**Cambios clave:** Sin mutations, el total es computed (no estado manual), no se necesita `commit`/`dispatch`.
