---
order: 156
title: 'How does state management work in Nuxt? (useState, Pinia)'
difficulty: 'intermediate'
tags: ['nuxt', 'state-management', 'pinia']
summary: 'useState for SSR-safe shared state (serialized in the payload). Pinia for complex domains with actions and getters. Never use plain ref at module scope.'
---

Nuxt provides `useState`, an SSR-safe composable for sharing reactive state across components. For complex state, you add Pinia as a module. The key rule: never use plain `ref` or `reactive` at module scope in Nuxt, because that state leaks between requests on the server.

## useState

`useState` creates a keyed reactive reference that is serialized from server to client during SSR:

```ts
const count = useState('count', () => 0)
```

The first argument is a unique key. The second is a factory function that returns the initial value. Any component that calls `useState('count')` gets the same reactive reference.

```vue
<!-- components/Counter.vue -->
<script setup>
const count = useState('count', () => 0)
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

## Shared state composables

Wrap `useState` in composables for type safety and reuse:

```ts
// composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null)
}
```

```vue
<!-- Any component — same state instance everywhere -->
<script setup>
const user = useUser()
</script>
```

## Why not just use ref?

A `ref` declared at module scope is shared across ALL requests on the server. User A's data leaks into User B's response.

```ts
// composables/useBad.ts
const user = ref(null) // WRONG — shared across requests on the server

export function useBad() {
  return user
}
```

```ts
// composables/useGood.ts
export function useGood() {
  return useState('user', () => null) // each request gets its own instance
}
```

`useState` is scoped per request on the server and serialized to the client via the Nuxt payload, so state transfers cleanly without double-fetching.

## Initializing state with async data

Use `callOnce` to run initialization logic only once (on server during SSR, never replayed on client):

```vue
<script setup>
const config = useState('config')

await callOnce(async () => {
  config.value = await $fetch('/api/config')
})
</script>
```

## Clearing state

```ts
clearNuxtState('count')

clearNuxtState(['count', 'user'])

clearNuxtState() // clears everything
```

## Pinia in Nuxt

For complex state with actions, getters, and devtools integration, add Pinia:

```bash
npx nuxi module add pinia
```

Stores work like regular Pinia. The `@pinia/nuxt` module auto-imports them from `stores/`:

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  )

  function addItem(product: Product) {
    const existing = items.value.find((i) => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({ ...product, qty: 1 })
    }
  }

  return { items, total, addItem }
})
```

```vue
<script setup>
const cart = useCartStore()
</script>

<template>
  <p>Total: {{ cart.total }}</p>
</template>
```

## useState vs Pinia

|             | useState                                           | Pinia                                          |
| ----------- | -------------------------------------------------- | ---------------------------------------------- |
| Setup       | Built-in, zero config                              | Requires `@pinia/nuxt` module                  |
| State shape | Single value per key                               | Grouped state + getters + actions              |
| DevTools    | Basic                                              | Full time-travel debugging                     |
| SSR safe    | Yes                                                | Yes (with Nuxt module)                         |
| Best for    | Simple shared values (locale, theme, current user) | Complex domains (cart, auth, multi-step forms) |

## Serialization limits

`useState` values are serialized to JSON when transferring from server to client. You cannot store functions, class instances, symbols, or circular references:

```ts
useState('fn', () => () => {}) // will break
useState('data', () => ({ name: 'Vue' })) // works fine
```

See also: [How does Pinia work?](/q/how-pinia-works) · [When should state live in Pinia vs a composable vs a local ref?](/q/pinia-vs-composable-vs-local) · [What is SSR cross-request state pollution?](/q/ssr-cross-request-state-pollution)

## References

- [State Management](https://nuxt.com/docs/getting-started/state-management) - Nuxt docs
- [useState](https://nuxt.com/docs/api/composables/use-state) - Nuxt docs
- [Pinia with Nuxt](https://pinia.vuejs.org/ssr/nuxt.html) - Pinia docs
