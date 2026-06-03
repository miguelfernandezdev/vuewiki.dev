---
order: 100
title: 'How would you migrate a Vuex module to Pinia?'
difficulty: 'advanced'
tags: ['state-management', 'migration', 'pinia', 'vuex']
summary: 'Each Vuex module becomes a defineStore. Mutations disappear, commit/dispatch become direct method calls. Update every consuming component.'
---

Migrating from Vuex to Pinia is mostly mechanical: each Vuex module becomes its own `defineStore`, mutations disappear, and string-based `commit`/`dispatch` calls become direct method calls. The hard part isn't the store itself. It's finding and updating every component that uses it.

## Step-by-step conversion

### Before: Vuex module

```ts
const cartModule = {
  namespaced: true,
  state: () => ({
    items: [] as CartItem[],
    total: 0
  }),
  getters: {
    itemCount: (state) => state.items.length
  },
  mutations: {
    ADD_ITEM(state, item: CartItem) {
      state.items.push(item)
      state.total += item.price
    },
    CLEAR(state) {
      state.items = []
      state.total = 0
    }
  },
  actions: {
    async checkout({ state, commit }) {
      await api.checkout(state.items)
      commit('CLEAR')
    }
  }
}
```

### After: Pinia store

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  )
  const itemCount = computed(() => items.value.length)

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  function clear() {
    items.value = []
  }

  async function checkout() {
    await api.checkout(items.value)
    clear()
  }

  return { items, total, itemCount, addItem, clear, checkout }
})
```

### What changed

| Vuex                                      | Pinia                 | Why                                                                      |
| ----------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `state.total` (manual tracking)           | `computed(() => ...)` | Computed derives from state, no manual sync needed                       |
| Mutations (`ADD_ITEM`, `CLEAR`)           | Regular functions     | Pinia tracks state changes through reactivity, no mutations layer needed |
| `commit('CLEAR')`                         | `clear()`             | Direct function call, type-safe                                          |
| `state, commit` destructured from context | Direct access to refs | Everything is in scope, no context object                                |
| Namespaced module (`cart/ADD_ITEM`)       | Independent store     | No namespace strings, just import the store                              |

### Updating components

```vue
<!-- Before: Vuex -->
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters('cart', ['itemCount'])
  },
  methods: {
    ...mapActions('cart', ['checkout'])
  }
}
</script>

<!-- After: Pinia -->
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <span>{{ cart.itemCount }} items</span>
  <button @click="cart.checkout()">Checkout</button>
</template>
```

<PlaygroundLink code="<!-- Before: Vuex -->
<script>
import { mapGetters, mapActions } from 'vuex'
&#10;export default {
  computed: {
    ...mapGetters('cart', ['itemCount'])
  },
  methods: {
    ...mapActions('cart', ['checkout'])
  }
}
</script>
&#10;<!-- After: Pinia -->
<script setup lang=&quot;ts&quot;>
import { useCartStore } from '@/stores/cart'
&#10;const cart = useCartStore()
</script>
&#10;<template>
  <span>{{ cart.itemCount }} items</span>
  <button @click=&quot;cart.checkout()&quot;>Checkout</button>
</template>" />

## Migration strategy for large apps

Don't rewrite everything at once. Pinia and Vuex can coexist in the same app:

1. Install Pinia alongside Vuex
2. Migrate one module at a time, starting with the simplest
3. Update all components that use that module
4. Remove the Vuex module
5. Repeat until no Vuex modules remain
6. Uninstall Vuex

See also: [What is Pinia and how does it differ from Vuex?](/q/pinia-vs-vuex) · [How does Vuex work?](/q/how-vuex-works) · [How does Pinia work internally?](/q/how-pinia-works)

## References

- [Migrating from Vuex](https://pinia.vuejs.org/cookbook/migration-vuex.html) - Pinia docs
- [Defining a Store](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Setup Stores](https://pinia.vuejs.org/core-concepts/#Setup-Stores) - Pinia docs
