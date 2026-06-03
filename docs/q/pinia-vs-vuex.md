---
order: 96
title: 'What is Pinia and how does it differ from Vuex?'
difficulty: 'beginner'
tags: ['state-management', 'pinia', 'vuex']
summary: 'Pinia replaces Vuex: no mutations, no string-based API, full TypeScript support, modular by design. Vuex is in maintenance mode.'
---

[Pinia](https://pinia.vuejs.org/) is the official state management library for Vue 3. It replaces [Vuex](/q/how-vuex-works). The Vue team created it because Vuex's design (mutations, string-based API, complex modules) didn't align well with TypeScript and the Composition API.

## Why Pinia replaced Vuex

Vuex has three pain points that Pinia eliminates:

**1. Mutations are gone.** In Vuex, you can't change state directly. You have to write a mutation (synchronous) and commit it by name. Pinia lets actions change state directly, because Vue 3's reactivity system tracks changes automatically through DevTools without needing a separate mutation layer.

**2. Full TypeScript inference.** Vuex relies on string keys (`commit('SET_USER')`, `dispatch('fetchUser')`, `getters.userName`). A typo in any of those strings is a runtime bug, not a compile error. Pinia stores are plain objects; your IDE knows every property and method.

**3. No modules or namespacing.** Vuex has one global store, split into namespaced modules (`store.commit('cart/ADD_ITEM')`). Pinia stores are independent, each is its own `defineStore()`, imported directly where needed.

## Side-by-side comparison

```ts
// Vuex: mutations required, string-based
store.commit('SET_COUNT', 5)
store.dispatch('fetchUsers')
store.getters.activeUsers

// Pinia: direct, type-safe
counterStore.count = 5
await userStore.fetchUsers()
userStore.activeUsers
```

## Defining a Pinia store

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  )

  function addItem(item: CartItem) {
    items.value.push(item)
  }

  async function checkout() {
    await api.checkout(items.value)
    items.value = []
  }

  return { items, total, addItem, checkout }
})
```

This uses the [Composition API syntax](https://pinia.vuejs.org/core-concepts/#Setup-Stores) (setup function). There's also an [Options syntax](https://pinia.vuejs.org/core-concepts/#Option-Stores) with `state`, `getters`, and `actions` properties. Same result, different style.

## Using it in a component

```vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <span>{{ cart.items.length }} items, {{ cart.total }}€</span>
  <button @click="cart.checkout()">Checkout</button>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { useCartStore } from '@/stores/cart'
&#10;const cart = useCartStore()
</script>
&#10;<template>
  <span>{{ cart.items.length }} items, {{ cart.total }}€</span>
  <button @click=&quot;cart.checkout()&quot;>Checkout</button>
</template>" />

No `commit`, no `dispatch`, no `mapGetters`. Just import the store and use it.

## Key differences table

| Aspect          | Vuex                          | Pinia                            |
| --------------- | ----------------------------- | -------------------------------- |
| Mutations       | Required (synchronous)        | Don't exist                      |
| TypeScript      | Limited, string-based API     | Full inference, type-safe        |
| Store structure | One store, namespaced modules | Independent stores               |
| DevTools        | Yes                           | Yes (time-travel, state editing) |
| SSR             | Requires careful setup        | Built-in support                 |
| Bundle size     | ~6kb                          | ~1kb                             |

See also: [How does Vuex work?](/q/how-vuex-works) · [How does Pinia work internally?](/q/how-pinia-works) · [How would you migrate a Vuex module to Pinia?](/q/vuex-module-to-pinia)

## References

- [What is Pinia?](https://pinia.vuejs.org/introduction.html) - Pinia docs
- [Comparison with Vuex](https://pinia.vuejs.org/introduction.html#comparison-with-vuex-3-x-4-x) - Pinia docs
- [Migrating from Vuex](https://pinia.vuejs.org/cookbook/migration-vuex.html) - Pinia docs
