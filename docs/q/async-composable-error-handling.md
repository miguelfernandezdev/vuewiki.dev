---
order: 95
title: 'How do you handle errors in async composables?'
difficulty: 'intermediate'
tags: ['composables', 'error-handling', 'watchers']
summary: 'Return an error ref alongside data and isLoading. The composable catches errors internally and exposes them as reactive state.'
---

Return an `error` ref alongside `data` and `isLoading`. The composable catches errors internally and exposes them as reactive state, so the component can render error UI without try/catch blocks in the template. Never let errors escape silently, and never throw from a composable unless the caller explicitly expects it.

## Basic pattern

```ts
// composables/useFetchData.ts
export function useFetchData<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null

    try {
      data.value = await $fetch<T>(url)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  execute()

  return { data, error, isLoading, retry: execute }
}
```

```vue
<script setup>
const { data: users, error, isLoading, retry } = useFetchData<User[]>('/api/users')
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">
    <p>Failed to load: {{ error.message }}</p>
    <button @click="retry">Try again</button>
  </div>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

<PlaygroundLink code="<script setup>
const { data: users, error, isLoading, retry } = useFetchData<User[]>('/api/users')
</script>
&#10;<template>
  <div v-if=&quot;isLoading&quot;>Loading...</div>
  <div v-else-if=&quot;error&quot;>
    <p>Failed to load: {{ error.message }}</p>
    <button @click=&quot;retry&quot;>Try again</button>
  </div>
  <ul v-else-if=&quot;users&quot;>
    <li v-for=&quot;user in users&quot; :key=&quot;user.id&quot;>{{ user.name }}</li>
  </ul>
</template>" />

The component handles three states (loading, error, success) declaratively. The `retry` function lets the user recover from transient failures.

## Why not throw?

If the composable throws, the error propagates up and crashes the component's setup. There's nothing to catch it unless the component wraps the call in try/catch, which defeats the purpose of the composable abstracting async logic:

```ts
// BAD: throwing from a composable
export function useFetchData<T>(url: string) {
  const data = ref<T | null>(null)

  onMounted(async () => {
    data.value = await $fetch<T>(url) // throws on error — crashes the component
  })

  return { data }
}
```

Returning an `error` ref gives the consumer full control over how to display the error.

## Watching reactive URLs

When the URL depends on reactive state, re-fetch on change and handle errors for each request:

```ts
export function useFetchData<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    const resolvedUrl = toValue(url)
    isLoading.value = true
    error.value = null

    try {
      data.value = await $fetch<T>(resolvedUrl)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      data.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(() => toValue(url), execute, { immediate: true })

  return { data, error, isLoading, retry: execute }
}
```

```vue
<script setup>
const userId = ref(1)
const { data: user, error } =
  useFetchData < User > (() => `/api/users/${userId.value}`)
</script>
```

<PlaygroundLink code="<script setup>
const userId = ref(1)
const { data: user, error } =
  useFetchData < User > (() => `/api/users/${userId.value}`)
</script>" />

Each time `userId` changes, the composable fetches the new URL and resets the error state.

## Typed errors for different failure modes

Differentiate between network errors, validation errors, and business logic errors:

```ts
interface FetchResult<T> {
  data: Ref<T | null>
  error: Ref<FetchError | null>
  isLoading: Ref<boolean>
  retry: () => Promise<void>
}

interface FetchError {
  message: string
  status?: number
  isNetworkError: boolean
  isValidationError: boolean
}

function toFetchError(e: unknown): FetchError {
  if (e instanceof Response || (e && typeof e === 'object' && 'status' in e)) {
    const status = (e as any).status
    return {
      message: `Request failed with status ${status}`,
      status,
      isNetworkError: false,
      isValidationError: status === 422
    }
  }

  return {
    message: e instanceof Error ? e.message : String(e),
    isNetworkError: true,
    isValidationError: false
  }
}
```

```vue
<template>
  <div v-if="error?.isNetworkError">
    Check your connection.
    <button @click="retry">Retry</button>
  </div>
  <div v-else-if="error?.isValidationError">
    The submitted data was invalid.
  </div>
  <div v-else-if="error">Something went wrong: {{ error.message }}</div>
</template>
```

<PlaygroundLink code="<template>
  <div v-if=&quot;error?.isNetworkError&quot;>
    Check your connection.
    <button @click=&quot;retry&quot;>Retry</button>
  </div>
  <div v-else-if=&quot;error?.isValidationError&quot;>
    The submitted data was invalid.
  </div>
  <div v-else-if=&quot;error&quot;>Something went wrong: {{ error.message }}</div>
</template>" />

## Global error handling with onErrorCaptured

For errors that composables can't handle (unexpected runtime errors), use `onErrorCaptured` in a parent component:

```vue
<!-- ErrorBoundary.vue -->
<script setup>
const error = (ref < Error) | (null > null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <div v-if="error">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="error = null">Dismiss</button>
  </div>
  <slot v-else />
</template>
```

<PlaygroundLink code="<script setup>
const error = (ref < Error) | (null > null)
&#10;onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>
&#10;<template>
  <div v-if=&quot;error&quot;>
    <p>Something went wrong: {{ error.message }}</p>
    <button @click=&quot;error = null&quot;>Dismiss</button>
  </div>
  <slot v-else />
</template>" />

```vue
<!-- Usage -->
<ErrorBoundary>
  <UserProfile :user-id="1" />
</ErrorBoundary>
```

<PlaygroundLink code="<ErrorBoundary>
  <UserProfile :user-id=&quot;1&quot; />
</ErrorBoundary>" />

This catches errors from descendant components thrown during: renders, watchers, lifecycle hooks, event handlers, `setup()`, custom directive hooks, and transition hooks. It prevents the entire app from crashing.

## Checklist

| Practice                                    | Why                                        |
| ------------------------------------------- | ------------------------------------------ |
| Return `error` ref, don't throw             | Consumer controls error rendering          |
| Reset error before each request             | Stale errors don't persist through retries |
| Expose a `retry` function                   | Lets users recover from transient failures |
| Type errors by category                     | Different errors need different UI         |
| Use `onErrorCaptured` for unexpected errors | Prevents full app crashes                  |

See also: [How would you build a composable for data fetching?](/q/composable-data-fetching) · [What is a composable?](/q/what-is-a-composable) · [How does error handling work in Vue?](/q/error-handling)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
