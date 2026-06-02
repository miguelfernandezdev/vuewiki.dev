---
order: 121
title: "How would you implement global error handling in a Vue app?"
difficulty: "advanced"
tags: ["error-handling", "architecture"]
---

Vue provides multiple layers for catching errors: `app.config.errorHandler` for uncaught errors globally, `onErrorCaptured` for errors in a component subtree, and try/catch for async operations. A production app should combine all three, plus a user-facing error UI.

## app.config.errorHandler (global catch-all)

This is the last line of defense. It catches any unhandled error from components, watchers, lifecycle hooks, and event handlers:

```ts
// main.ts
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Unhandled error:', err)
  console.error('Component:', instance?.$options?.name || 'unknown')
  console.error('Hook:', info)

  // Send to error tracking service
  reportToSentry(err, { component: instance?.$options?.name, info })
}
```

| Parameter | What it contains |
|---|---|
| `err` | The Error object |
| `instance` | The component instance that threw (or null) |
| `info` | Where the error occurred: `'setup function'`, `'render function'`, `'watcher callback'`, etc. |

## onErrorCaptured (component-level boundary)

`onErrorCaptured` catches errors from any descendant component. It works like an error boundary: you can handle the error locally and prevent it from propagating up.

```vue
<!-- components/ErrorBoundary.vue -->
<script setup lang="ts">
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  return false // stop propagation — don't reach app.config.errorHandler
})

function retry() {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="error-state">
    <h3>Something went wrong</h3>
    <p>{{ error.message }}</p>
    <button @click="retry">Try again</button>
  </div>
  <slot v-else />
</template>
```

Wrap sections of your app that can fail:

```vue
<template>
  <AppHeader />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <AppFooter />
</template>
```

If a page crashes, the header and footer stay visible. The user sees an error message with a retry button instead of a blank screen.

## Return value of onErrorCaptured

| Return | Effect |
|---|---|
| `false` | Error is captured, stops propagating |
| `true` or nothing | Error continues to parent and eventually to `app.config.errorHandler` |

## Async error handling

`app.config.errorHandler` catches errors in async lifecycle hooks and watchers. But `$fetch`, `fetch`, or any promise in an event handler needs explicit try/catch:

```vue
<script setup>
const error = ref<string | null>(null)
const isLoading = ref(false)

async function submitForm(data: FormData) {
  error.value = null
  isLoading.value = true
  try {
    await $fetch('/api/submit', { method: 'POST', body: data })
    navigateTo('/success')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="error" class="alert-error">{{ error }}</div>
  <form @submit.prevent="submitForm">...</form>
</template>
```

## Composable for async operations

Extract the try/catch pattern into a reusable composable:

```ts
// composables/useAsyncAction.ts
export function useAsyncAction<T>(action: () => Promise<T>) {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const result = await action()
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unexpected error'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { execute, isLoading, error }
}
```

```vue
<script setup>
const { execute: submit, isLoading, error } = useAsyncAction(
  () => $fetch('/api/submit', { method: 'POST', body: formData })
)
</script>
```

## Nuxt error handling

Nuxt adds framework-level error handling on top of Vue's:

**error.vue** catches fatal errors and renders a full-page error screen:

```vue
<!-- error.vue -->
<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="goHome">Go home</button>
  </div>
</template>
```

**showError / createError** for explicit error throwing:

```ts
// In a page or middleware
throw createError({ statusCode: 404, statusMessage: 'Page not found' })
```

**NuxtErrorBoundary** for scoped error catching:

```vue
<template>
  <NuxtErrorBoundary>
    <SomeRiskyComponent />
    <template #error="{ error, clearError }">
      <p>{{ error.message }}</p>
      <button @click="clearError">Retry</button>
    </template>
  </NuxtErrorBoundary>
</template>
```

## Error handling layers

```
Try/catch in event handlers (local, explicit)
        ↓ uncaught
onErrorCaptured in ErrorBoundary (component subtree)
        ↓ propagates if not returning false
app.config.errorHandler (global catch-all)
        ↓ in Nuxt
error.vue (fatal page-level errors)
```

See also: [How do you debug SSR requests?](/q/debug-ssr-requests) · [What causes SSR hydration mismatches?](/q/ssr-hydration-mismatch) · [How does the Vue plugin system work?](/q/plugin-system)

## References

- [errorHandler](https://vuejs.org/api/application.html#app-config-errorhandler) - Vue.js docs
- [onErrorCaptured](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
- [Error Handling](https://nuxt.com/docs/getting-started/error-handling) - Nuxt docs
