---
order: 163
title: "What is SSR cross-request state pollution and how do you avoid it?"
difficulty: "advanced"
tags: ["nuxt", "ssr", "state-management", "pinia", "provide-inject"]
summary: "Module-scope reactive state is shared across ALL server requests. Each request needs its own state instance — use app-level provide or Pinia's per-request stores."
---

In SSR, the server process handles multiple requests. If you declare reactive state at module scope, that state is a singleton shared across ALL requests. User A's data can leak into User B's response. This is a security vulnerability, not just a bug.

## How it happens

```ts
// composables/useUser.ts
const user = ref(null) // module-level singleton

export function useUser() {
  return user
}
```

On the server, this `ref` is created once when the module loads. Every request that calls `useUser()` gets the same reference:

1. Request A arrives, sets `user.value = { name: 'Alice' }`
2. Request B arrives before A finishes, reads `user.value` and sees Alice's data
3. Request B sets `user.value = { name: 'Bob' }`
4. Request A's response now contains Bob's data

The problem applies to any module-level mutable state: `ref`, `reactive`, `Map`, `Set`, plain objects, even a counter variable.

## Red flags

```ts
// ALL of these are dangerous at module scope in SSR
export const user = ref(null)
export const appState = reactive({ theme: 'dark' })
export const cache = new Map()
let requestCount = 0
```

## Solution 1: useState (Nuxt)

Nuxt's `useState` creates an isolated instance per request on the server:

```ts
// composables/useUser.ts
export function useUser() {
  return useState<User | null>('user', () => null)
}
```

Each request gets its own `'user'` state. After SSR, the value serializes into the payload and hydrates on the client.

## Solution 2: Pinia

Pinia handles request isolation automatically in Nuxt. Each request gets a fresh Pinia instance:

```ts
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  async function login(credentials: Credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
  }

  return { user, isLoggedIn, login }
})
```

No special handling needed. The `@pinia/nuxt` module takes care of creating and disposing store instances per request.

## Solution 3: factory pattern (vanilla Vue SSR)

If you're not using Nuxt, create fresh instances per request manually:

```ts
// store.ts
export function createStore() {
  const state = reactive({
    user: null,
    cart: []
  })

  return {
    state: readonly(state),
    setUser(user: User) { state.user = user },
    addToCart(item: CartItem) { state.cart.push(item) }
  }
}
```

```ts
// entry-server.ts
export async function render(url: string) {
  const app = createApp(App)
  const store = createStore() // fresh per request
  app.provide('store', store)

  const html = await renderToString(app)
  return { html, state: store.state }
}
```

## The rule

Never declare mutable state at module scope in code that runs on the server. Always use one of:

| Approach | When to use |
|---|---|
| `useState` | Nuxt projects, simple shared values |
| Pinia with `@pinia/nuxt` | Nuxt projects, complex state with actions/getters |
| Factory function + provide/inject | Vanilla Vue SSR without Nuxt |

Immutable module-level values (constants, type definitions, pure functions) are safe because they don't change between requests.

See also: [How does Pinia work?](/q/how-pinia-works) · [How does Nuxt handle state management?](/q/nuxt-state-management)

## References

- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Pinia SSR](https://pinia.vuejs.org/ssr/) - Pinia docs
