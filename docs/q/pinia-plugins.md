---
order: 101
title: "What are Pinia plugins and how do you create one?"
difficulty: "advanced"
tags: ["state-management", "architecture", "pinia"]
summary: "A function that runs for every store creation. Use them to add localStorage persistence, logging, shared properties, or action wrappers."
---

Pinia plugins let you add behavior to every store globally: persist state to localStorage, add shared properties, wrap actions with logging, sync with external systems. A plugin is a function that receives a context object and runs once per store creation.

## Creating a plugin

A plugin is a function that Pinia calls for every store:

```ts
import { type PiniaPlugin } from 'pinia'

const myPlugin: PiniaPlugin = (context) => {
  // context.store  — the store instance
  // context.pinia  — the Pinia root instance
  // context.app    — the Vue app instance
  // context.options — the options passed to defineStore
}
```

Register it before mounting the app:

```ts
const pinia = createPinia()
pinia.use(myPlugin)
app.use(pinia)
```

## Example: localStorage persistence

```ts
function piniaLocalStorage(): PiniaPlugin {
  return ({ store }) => {
    const saved = localStorage.getItem(store.$id)
    if (saved) {
      store.$patch(JSON.parse(saved))
    }

    store.$subscribe((mutation, state) => {
      localStorage.setItem(store.$id, JSON.stringify(state))
    })
  }
}

const pinia = createPinia()
pinia.use(piniaLocalStorage())
```

Every store now automatically saves and restores its state from localStorage.

## Example: action logger

```ts
function piniaLogger(): PiniaPlugin {
  return ({ store }) => {
    store.$onAction(({ name, args, after, onError }) => {
      const start = performance.now()

      after(() => {
        const duration = (performance.now() - start).toFixed(1)
        console.log(`[${store.$id}] ${name}(${JSON.stringify(args)}) — ${duration}ms`)
      })

      onError((error) => {
        console.error(`[${store.$id}] ${name} failed:`, error)
      })
    })
  }
}
```

## Adding properties to every store

Return an object from the plugin to extend all stores:

```ts
function piniaCreatedAt(): PiniaPlugin {
  return ({ store }) => {
    store.createdAt = new Date()
    return { createdAt: store.createdAt }
  }
}
```

For TypeScript, augment the store interface:

```ts
declare module 'pinia' {
  export interface PiniaCustomProperties {
    createdAt: Date
  }
}
```

Now `store.createdAt` is available and typed on every store.

## Adding state to every store

Use `ref` to add reactive state that gets included in devtools and serialization:

```ts
function piniaLoadingState(): PiniaPlugin {
  return ({ store }) => {
    const isLoading = ref(false)

    store.$onAction(({ after, onError }) => {
      isLoading.value = true
      after(() => { isLoading.value = false })
      onError(() => { isLoading.value = false })
    })

    return { isLoading }
  }
}
```

```vue
<script setup>
const userStore = useUserStore()
// isLoading is available on every store
</script>

<template>
  <Spinner v-if="userStore.isLoading" />
</template>
```

## Targeting specific stores

Check `store.$id` or use the options object to apply logic selectively:

```ts
function piniaDebounce(): PiniaPlugin {
  return ({ store, options }) => {
    if (options.debounce) {
      return Object.keys(options.debounce).reduce((debounced, action) => {
        debounced[action] = useDebounceFn(
          store[action],
          options.debounce[action]
        )
        return debounced
      }, {} as Record<string, Function>)
    }
  }
}
```

```ts
defineStore('search', {
  actions: {
    search() { /* ... */ }
  },
  debounce: {
    search: 300
  }
})
```

## Plugins in Nuxt

With `@pinia/nuxt`, register plugins in a Nuxt plugin file:

```ts
// plugins/pinia-persist.ts
export default defineNuxtPlugin(({ $pinia }) => {
  if (import.meta.client) {
    $pinia.use(piniaLocalStorage())
  }
})
```

## Popular community plugins

| Plugin | What it does |
|---|---|
| `pinia-plugin-persistedstate` | Persist stores to localStorage/sessionStorage/cookies with fine-grained control |
| `@pinia/colada` | Async state management (data fetching, caching, invalidation) |

## Plugin vs store action vs composable

| Need | Use |
|---|---|
| Behavior added to ALL stores (logging, persistence, shared state) | Plugin |
| Business logic for one specific store | Store action |
| Reusable logic not tied to a store | Composable |

See also: [How does Pinia work?](/q/how-pinia-works) · [What is Pinia Colada?](/q/pinia-colada) · [When should state live in Pinia vs a composable vs a local ref?](/q/pinia-vs-composable-vs-local)

## References

- [Plugins](https://pinia.vuejs.org/core-concepts/plugins.html) - Pinia docs
- [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Persisted state plugin docs
- [Defining Stores](https://pinia.vuejs.org/core-concepts/) - Pinia docs
