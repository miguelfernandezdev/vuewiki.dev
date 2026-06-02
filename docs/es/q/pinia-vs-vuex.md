---
order: 9
title: "¿Qué es Pinia y en qué se diferencia de Vuex?"
difficulty: "beginner"
tags: ["state-management"]
---

[Pinia](https://pinia.vuejs.org/) es la librería oficial de gestión de estado para Vue 3. Reemplaza a [Vuex](/es/q/how-vuex-works) — el equipo de Vue la creó porque el diseño de Vuex (mutations, API basada en strings, módulos complejos) no encajaba bien con TypeScript y la Composition API.

## Por qué Pinia reemplazó a Vuex

Vuex tiene tres puntos de dolor que Pinia elimina:

**1. Las mutations desaparecen.** En Vuex, no puedes cambiar el estado directamente — tienes que escribir una mutation (síncrona) y hacer commit por nombre. Pinia permite que las actions cambien el estado directamente, porque el sistema de reactividad de Vue 3 rastrea los cambios automáticamente a través de DevTools sin necesitar una capa de mutations separada.

**2. Inferencia completa de TypeScript.** Vuex depende de claves string (`commit('SET_USER')`, `dispatch('fetchUser')`, `getters.userName`). Un typo en cualquiera de esos strings es un bug en runtime, no un error de compilación. Los stores de Pinia son objetos planos — tu IDE conoce cada propiedad y método.

**3. Sin módulos ni namespacing.** Vuex tiene un store global, dividido en módulos con namespace (`store.commit('cart/ADD_ITEM')`). Los stores de Pinia son independientes — cada uno es su propio `defineStore()`, importado directamente donde se necesite.

## Comparación lado a lado

```ts
// Vuex: mutations requeridas, basado en strings
store.commit('SET_COUNT', 5)
store.dispatch('fetchUsers')
store.getters.activeUsers

// Pinia: directo, type-safe
counterStore.count = 5
await userStore.fetchUsers()
userStore.activeUsers
```

## Definiendo un store de Pinia

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

Esto usa la [sintaxis de Composition API](https://pinia.vuejs.org/core-concepts/#Setup-Stores) (función setup). También hay una [sintaxis Options](https://pinia.vuejs.org/core-concepts/#Option-Stores) con propiedades `state`, `getters` y `actions` — mismo resultado, diferente estilo.

## Usándolo en un componente

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

Sin `commit`, sin `dispatch`, sin `mapGetters`. Solo importa el store y úsalo.

## Tabla de diferencias clave

| Aspecto | Vuex | Pinia |
| --- | --- | --- |
| Mutations | Requeridas (síncronas) | No existen |
| TypeScript | Limitado, API basada en strings | Inferencia completa, type-safe |
| Estructura del store | Un store, módulos con namespace | Stores independientes |
| DevTools | Sí | Sí (time-travel, edición de estado) |
| SSR | Requiere configuración cuidadosa | Soporte integrado |
| Tamaño del bundle | ~6kb | ~1.5kb |

Ver también: [¿Cómo funciona Vuex?](/es/q/how-vuex-works) · [¿Cómo funciona Pinia internamente?](/es/q/how-pinia-works) · [¿Cómo migrarías un módulo de Vuex a Pinia?](/es/q/vuex-module-to-pinia)

## Referencias

- [What is Pinia?](https://pinia.vuejs.org/introduction.html) - Pinia docs
- [Comparison with Vuex](https://pinia.vuejs.org/introduction.html#comparison-with-vuex-3-x-4-x) - Pinia docs
- [Migrating from Vuex](https://pinia.vuejs.org/cookbook/migration-vuex.html) - Pinia docs
