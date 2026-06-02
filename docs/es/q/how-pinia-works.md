---
order: 101
title: "¿Cómo funciona Pinia internamente? (stores, state, getters, actions)"
difficulty: "intermediate"
tags: ["state-management"]
---

Pinia es la librería oficial de gestión de estado de Vue. Cada store es una unidad reactiva aislada con state, getters (valores computed) y actions (métodos). Bajo el capó, un store es un objeto `reactive` mejorado con integración de devtools, soporte de plugins y seguridad en SSR.

## Definir un store

Hay dos sintaxis. Ambas producen el mismo resultado.

### Sintaxis Options

```ts
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    lastChanged: null as Date | null
  }),
  getters: {
    doubled: (state) => state.count * 2,
    isPositive(): boolean {
      return this.count > 0 // 'this' es la instancia del store
    }
  },
  actions: {
    increment() {
      this.count++
      this.lastChanged = new Date()
    },
    async fetchCount() {
      const { count } = await fetch('/api/count').then(r => r.json())
      this.count = count
    }
  }
})
```

### Sintaxis Setup (estilo Composition API)

```ts
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const lastChanged = ref<Date | null>(null)

  const doubled = computed(() => count.value * 2)
  const isPositive = computed(() => count.value > 0)

  function increment() {
    count.value++
    lastChanged.value = new Date()
  }

  async function fetchCount() {
    const { count: c } = await fetch('/api/count').then(r => r.json())
    count.value = c
  }

  return { count, lastChanged, doubled, isPositive, increment, fetchCount }
})
```

`ref` se convierte en state, `computed` en getters y las funciones simples en actions.

## Usar un store

```vue
<script setup>
const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }} (doble: {{ counter.doubled }})</p>
  <button @click="counter.increment()">+1</button>
</template>
```

La instancia del store es reactiva. Accede a las propiedades directamente, sin necesidad de `.value` en el template.

## Desestructurar con storeToRefs

Desestructurar un store rompe la reactividad. Usa `storeToRefs` para mantener los refs conectados:

```vue
<script setup>
import { storeToRefs } from 'pinia'

const counter = useCounterStore()
const { count, doubled } = storeToRefs(counter) // refs reactivos
const { increment } = counter                    // las actions no necesitan storeToRefs
</script>
```

## Modificar el state

```ts
const store = useCounterStore()

// Mutación directa
store.count++

// Actualizar varias propiedades a la vez
store.$patch({
  count: 10,
  lastChanged: new Date()
})

// Actualizar con una función (mejor para arrays)
store.$patch((state) => {
  state.count += 5
  state.lastChanged = new Date()
})

// Restablecer el state completo
store.$reset()
```

## Suscribirse a cambios

```ts
const store = useCounterStore()

store.$subscribe((mutation, state) => {
  console.log(mutation.type)    // 'direct' | 'patch object' | 'patch function'
  console.log(mutation.storeId) // 'counter'
  localStorage.setItem('counter', JSON.stringify(state))
})

store.$onAction(({ name, args, after, onError }) => {
  console.log(`Action ${name} llamada con`, args)

  after((result) => {
    console.log(`Action ${name} terminó con`, result)
  })

  onError((error) => {
    console.error(`Action ${name} falló`, error)
  })
})
```

## Stores que usan otros stores

Los stores pueden llamarse entre sí dentro de getters o actions:

```ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const authStore = useAuthStore()

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.qty, 0)
  )

  async function checkout() {
    if (!authStore.isLoggedIn) throw new Error('No has iniciado sesión')
    await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: items.value })
    })
    items.value = []
  }

  return { items, total, checkout }
})
```

## Qué hace Pinia bajo el capó

1. `defineStore` registra una fábrica de store identificada por ID (`'counter'`)
2. La primera vez que llamas a `useCounterStore()`, Pinia crea un objeto `reactive` con tu state, envuelve los getters como `computed` y enlaza las actions a la instancia del store
3. Las llamadas posteriores devuelven la misma instancia (por raíz de Pinia, lo que significa por petición en SSR)
4. `$patch`, `$subscribe` y `$onAction` se añaden automáticamente a cada instancia de store
5. El plugin de Vue Devtools se engancha a estos para mostrar cambios de state, líneas de tiempo de actions y depuración con viaje en el tiempo

Ver también: [¿Qué es Pinia y en qué se diferencia de Vuex?](/es/q/pinia-vs-vuex) · [¿Qué son los plugins de Pinia?](/es/q/pinia-plugins) · [¿Cómo testear un store de Pinia?](/es/q/test-pinia-store)

## Referencias

- [Defining a Store](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Getters](https://pinia.vuejs.org/core-concepts/getters.html) - Pinia docs
- [Actions](https://pinia.vuejs.org/core-concepts/actions.html) - Pinia docs
