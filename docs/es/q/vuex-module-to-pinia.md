---
order: 28
title: "¿Cómo migrarías un módulo de Vuex a Pinia?"
difficulty: "advanced"
tags: ["state-management", "migration"]
---

Migrar de Vuex a Pinia es mayormente mecánico: cada módulo de Vuex se convierte en su propio `defineStore`, las mutations desaparecen, y las llamadas basadas en strings `commit`/`dispatch` se convierten en llamadas directas a métodos. La parte difícil no es el store en sí — es encontrar y actualizar cada componente que lo usa.

## Conversión paso a paso

### Antes: módulo de Vuex

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

### Después: store de Pinia

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

### Qué cambió

| Vuex | Pinia | Por qué |
| --- | --- | --- |
| `state.total` (tracking manual) | `computed(() => ...)` | Computed deriva del estado — no necesita sincronización manual |
| Mutations (`ADD_ITEM`, `CLEAR`) | Funciones normales | Pinia rastrea cambios de estado a través de reactividad, no necesita capa de mutations |
| `commit('CLEAR')` | `clear()` | Llamada directa a función, type-safe |
| `state, commit` destructurados del contexto | Acceso directo a refs | Todo está en scope, sin objeto de contexto |
| Módulo con namespace (`cart/ADD_ITEM`) | Store independiente | Sin strings de namespace, solo importa el store |

### Actualizando componentes

```vue
<!-- Antes: Vuex -->
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

<!-- Después: Pinia -->
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <span>{{ cart.itemCount }} items</span>
  <button @click="cart.checkout()">Checkout</button>
</template>
```

## Estrategia de migración para apps grandes

No reescribas todo de una vez. Pinia y Vuex pueden coexistir en la misma app:

1. Instala Pinia junto a Vuex
2. Migra un módulo a la vez, empezando por el más simple
3. Actualiza todos los componentes que usan ese módulo
4. Elimina el módulo de Vuex
5. Repite hasta que no queden módulos de Vuex
6. Desinstala Vuex

Ver también: [¿Qué es Pinia y en qué se diferencia de Vuex?](/es/q/pinia-vs-vuex) · [¿Cómo funciona Vuex?](/es/q/how-vuex-works) · [¿Cómo funciona Pinia internamente?](/es/q/how-pinia-works)

## Referencias

- [Migrating from Vuex](https://pinia.vuejs.org/cookbook/migration-vuex.html) - Pinia docs
- [Defining a Store](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Setup Stores](https://pinia.vuejs.org/core-concepts/#Setup-Stores) - Pinia docs
