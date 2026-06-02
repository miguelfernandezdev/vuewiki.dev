---
order: 52
title: "How does error handling work in Vue?"
difficulty: "advanced"
tags: ["components", "error-handling", "suspense"]
summary: "onErrorCaptured catches errors from descendant components (error boundaries). app.config.errorHandler catches global uncaught errors. defineAsyncComponent has error options."
---

Vue provides `onErrorCaptured` to catch errors from descendant components, letting you build error boundaries similar to React's `componentDidCatch`. Combined with `app.config.errorHandler` for global errors and `defineAsyncComponent`'s error options, you can handle failures at every level.

## onErrorCaptured (error boundary)

A parent component can catch errors thrown by any descendant (including async errors from lifecycle hooks and watchers):

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error(`Error in ${info}:`, err)
  return false // stop propagation to parent error handlers
})
</script>

<template>
  <div v-if="error" class="error-state">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="error = null">Try again</button>
  </div>
  <slot v-else />
</template>
```

```vue
<!-- Usage -->
<template>
  <ErrorBoundary>
    <DashboardWidget />
  </ErrorBoundary>
</template>
```

The callback receives three arguments:

| Argument | Description |
|---|---|
| `err` | The error object |
| `instance` | The component instance that threw |
| `info` | A string describing where the error was caught (e.g., `"render"`, `"setup"`, `"watcher"`) |

Returning `false` prevents the error from propagating further. Returning `true` (or nothing) lets it bubble up to parent error handlers and `app.config.errorHandler`.

## Global error handler

Catches any error that wasn't stopped by `onErrorCaptured`:

```ts
// main.ts
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  // Send to error tracking service
  errorTracker.captureException(err, { info })
}
```

## Error flow

```
Component throws → nearest onErrorCaptured (can stop here)
                 → parent onErrorCaptured (can stop here)
                 → ... up the tree ...
                 → app.config.errorHandler
                 → console.error (if nothing catches it)
```

## Async component errors

`defineAsyncComponent` has its own error handling with retry logic:

```ts
const AsyncWidget = defineAsyncComponent({
  loader: () => import('./Widget.vue'),
  errorComponent: ErrorDisplay,
  timeout: 10000,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry()
    } else {
      fail() // shows errorComponent
    }
  }
})
```

## What Vue error handling catches

| Source | Caught? |
|---|---|
| Render/template errors | Yes |
| Lifecycle hook errors | Yes |
| Watcher callback errors | Yes |
| Component event handler errors | Yes |
| Custom directive hook errors | Yes |
| `setTimeout`/`setInterval` callbacks | No (not tracked by Vue) |
| Native event listeners added manually | No |
| Errors in third-party libraries | No (unless called from Vue lifecycle) |

For errors outside Vue's tracking (timers, manual listeners), use `window.addEventListener('error', handler)` or `window.addEventListener('unhandledrejection', handler)`.

## Practical pattern: multiple error boundaries

Wrap independent sections so one failure doesn't take down the whole page:

```vue
<template>
  <header>
    <ErrorBoundary>
      <Navigation />
    </ErrorBoundary>
  </header>

  <main>
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </main>

  <aside>
    <ErrorBoundary>
      <Sidebar />
    </ErrorBoundary>
  </aside>
</template>
```

See also: [What are async components?](/q/async-components) · [How does Suspense work?](/q/suspense)

## References

- [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
- [app.config.errorHandler](https://vuejs.org/api/application.html#app-config-errorhandler) - Vue.js docs
