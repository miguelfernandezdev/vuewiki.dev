---
order: 160
title: 'What happens if you call useFetch inside an event handler?'
difficulty: 'intermediate'
tags: ['nuxt', 'errors', 'vueuse']
summary: 'useFetch needs component context. Call it at the top of setup(), not inside event handlers. Use $fetch for user-triggered requests.'
---

It doesn't work as expected. `useFetch` and `useAsyncData` must be called at the top level of `<script setup>` (or in a plugin/middleware, or at the top level of a function in lifecycle hooks), not inside event handlers or callbacks. They rely on Nuxt's component context to register themselves for SSR payload transfer and deduplication. Inside an event handler, that context is gone. Use `$fetch` directly for requests triggered by user actions.

## The problem

```vue
<script setup>
async function handleClick() {
  // This will warn or behave incorrectly
  const { data } = await useFetch('/api/submit')
}
</script>

<template>
  <button @click="handleClick">Submit</button>
</template>
```

`useFetch` internally calls `useAsyncData`, which calls `getCurrentInstance()` to tie itself to the component's lifecycle. Inside an event handler, the async context may have been lost, so the composable can't register properly. The result: missing payload integration, broken reactivity, or a runtime warning about calling composables outside of setup.

## Why this restriction exists

Nuxt composables like `useFetch` do several things during setup:

1. Register a key in the SSR payload system
2. Check if data already exists in the payload (to skip the fetch on client hydration)
3. Bind reactive refs to the component instance
4. Set up automatic request cancellation on unmount

All of this depends on the component context being available. During setup, it is. Inside an event handler that fires minutes later, it's not guaranteed.

## The fix: use $fetch

For requests triggered by user actions, use `$fetch` directly:

```vue
<script setup>
const result = ref(null)
const isLoading = ref(false)
const error = ref(null)

async function handleSubmit() {
  isLoading.value = true
  error.value = null
  try {
    result.value = await $fetch('/api/submit', {
      method: 'POST',
      body: { name: 'Alice' }
    })
  } catch (e) {
    error.value = e
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button @click="handleSubmit" :disabled="isLoading">Submit</button>
  <p v-if="error">{{ error.message }}</p>
  <p v-if="result">Done!</p>
</template>
```

`$fetch` is a plain HTTP client (based on ofetch). It doesn't need the component context and works anywhere: event handlers, watchers, utility functions, server routes.

## Alternative: useFetch with immediate: false

If you want the reactive conveniences of `useFetch` (automatic `data`, `error`, `status` refs) but don't want it to execute immediately, declare it at the top level with `immediate: false` and call `execute` in the handler:

```vue
<script setup>
const { data, error, status, execute } = useFetch('/api/submit', {
  method: 'POST',
  body: { name: 'Alice' },
  immediate: false
})

function handleSubmit() {
  execute()
}
</script>

<template>
  <button @click="handleSubmit" :disabled="status === 'pending'">Submit</button>
  <p v-if="error">{{ error.message }}</p>
  <p v-if="data">Done!</p>
</template>
```

The `useFetch` call happens during setup (context available), but the actual HTTP request only fires when `execute()` is called. This gives you reactive loading/error state without managing refs manually.

## The same rule applies to useAsyncData

```vue
<script setup>
// BAD: inside a callback
function onClick() {
  const { data } = useAsyncData('key', () => $fetch('/api/data'))
}

// GOOD: top-level with lazy execution
const { data, execute } = useAsyncData('key', () => $fetch('/api/data'), {
  immediate: false
})

function onClick() {
  execute()
}
</script>
```

## Refreshing existing data from a handler

If you already have a `useFetch` that loaded data on page load and you want to reload it after a user action, use `refresh`:

```vue
<script setup>
const { data: users, refresh } = useFetch('/api/users')

async function handleDelete(id: number) {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
  refresh()
}
</script>
```

`refresh()` re-executes the original `useFetch` with its registered context. This is different from calling `useFetch` again inside the handler.

## Quick reference

| Scenario                            | Use                                              |
| ----------------------------------- | ------------------------------------------------ |
| Load data on page render (SSR)      | `useFetch` / `useAsyncData` at top level         |
| Submit form on button click         | `$fetch` in the handler                          |
| Load data on demand (lazy)          | `useFetch` with `immediate: false` + `execute()` |
| Reload existing data after mutation | `refresh()` on the existing `useFetch`           |
| Fetch in a utility function         | `$fetch` (no component context needed)           |

See also: [How does data fetching work in Nuxt?](/q/nuxt-data-fetching) · [How does the SSR payload work in Nuxt?](/q/nuxt-payload) · [How do Nitro server routes work?](/q/nuxt-nitro-server-routes)

## References

- [useFetch](https://nuxt.com/docs/api/composables/use-fetch) - Nuxt docs
- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
- [$fetch](https://nuxt.com/docs/api/utils/dollarfetch) - Nuxt docs
