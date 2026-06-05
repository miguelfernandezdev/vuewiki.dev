---
order: 98
title: 'How does Pinia work internally? (stores, state, getters, actions)'
difficulty: 'intermediate'
tags: ['state-management', 'pinia', 'vuex']
summary: 'Each Pinia store is a reactive object with state (refs), getters (computed), and actions (functions). Stores are isolated, type-safe, and support devtools.'
---

Pinia is Vue's official state management library. Each store is an isolated reactive unit with state, getters (computed values), and actions (methods). Under the hood, a store is a `reactive` object enhanced with devtools integration, plugin support, and SSR safety.

<img src="/diagrams/en/how-pinia-works.svg" alt="Architecture diagram showing Pinia store structure: defineStore creates state, getters, and actions that components access directly" style="max-width: 100%;" />

## Defining a store

There are two syntaxes. Both produce the same result.

### Options syntax

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
      return this.count > 0 // 'this' is the store instance
    }
  },
  actions: {
    increment() {
      this.count++
      this.lastChanged = new Date()
    },
    async fetchCount() {
      const { count } = await fetch('/api/count').then((r) => r.json())
      this.count = count
    }
  }
})
```

### Setup syntax (Composition API style)

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
    const { count: c } = await fetch('/api/count').then((r) => r.json())
    count.value = c
  }

  return { count, lastChanged, doubled, isPositive, increment, fetchCount }
})
```

`ref` becomes state, `computed` becomes getters, plain functions become actions.

## Using a store

```vue
<script setup>
const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click="counter.increment()">+1</button>
</template>
```

<PlaygroundLink code="<script setup>
const counter = useCounterStore()
</script>
&#10;<template>
  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click=&quot;counter.increment()&quot;>+1</button>
</template>" />

The store instance is reactive. Access properties directly, no `.value` needed in the template.

## Destructuring with storeToRefs

Destructuring a store breaks reactivity. Use `storeToRefs` to keep refs connected:

```vue
<script setup>
import { storeToRefs } from 'pinia'

const counter = useCounterStore()
const { count, doubled } = storeToRefs(counter) // reactive refs
const { increment } = counter // actions don't need storeToRefs
</script>
```

<PlaygroundLink code="<script setup>
import { storeToRefs } from 'pinia'
&#10;const counter = useCounterStore()
const { count, doubled } = storeToRefs(counter) // reactive refs
const { increment } = counter // actions don't need storeToRefs
</script>" />

## Modifying state

```ts
const store = useCounterStore()

// Direct mutation
store.count++

// Patch multiple properties at once
store.$patch({
  count: 10,
  lastChanged: new Date()
})

// Patch with a function (better for arrays)
store.$patch((state) => {
  state.count += 5
  state.lastChanged = new Date()
})

// Full state reset (Option stores only — Setup stores need a custom implementation)
store.$reset()
```

## Subscribing to changes

```ts
const store = useCounterStore()

store.$subscribe((mutation, state) => {
  console.log(mutation.type) // 'direct' | 'patch object' | 'patch function'
  console.log(mutation.storeId) // 'counter'
  localStorage.setItem('counter', JSON.stringify(state))
})

store.$onAction(({ name, args, after, onError }) => {
  console.log(`Action ${name} called with`, args)

  after((result) => {
    console.log(`Action ${name} finished with`, result)
  })

  onError((error) => {
    console.error(`Action ${name} failed`, error)
  })
})
```

## Stores using other stores

Stores can call each other inside getters or actions:

```ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const authStore = useAuthStore()

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.qty, 0)
  )

  async function checkout() {
    if (!authStore.isLoggedIn) throw new Error('Not logged in')
    await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: items.value })
    })
    items.value = []
  }

  return { items, total, checkout }
})
```

## What Pinia does under the hood

1. `defineStore` registers a store factory keyed by ID (`'counter'`)
2. The first time you call `useCounterStore()`, Pinia creates a `reactive` object with your state, wraps getters as `computed`, and binds actions to the store instance
3. Subsequent calls return the same instance (per Pinia root, which means per request in SSR)
4. `$patch`, `$subscribe`, and `$onAction` are added to every store instance automatically
5. The Vue Devtools plugin hooks into these to show state changes, action timelines, and time-travel debugging

See also: [What is Pinia and how does it differ from Vuex?](/q/pinia-vs-vuex) · [What are Pinia plugins?](/q/pinia-plugins) · [How do you test a Pinia store?](/q/test-pinia-store)

## References

- [Defining a Store](https://pinia.vuejs.org/core-concepts/) - Pinia docs
- [Getters](https://pinia.vuejs.org/core-concepts/getters.html) - Pinia docs
- [Actions](https://pinia.vuejs.org/core-concepts/actions.html) - Pinia docs
