---
order: 72
title: "How does Suspense work for async components?"
difficulty: "intermediate"
tags: ["components"]
---

`<Suspense>` is a built-in component that renders fallback content while its async children resolve. It works with two kinds of async dependencies: async components (`defineAsyncComponent`) and components with an `async setup()`.

## Basic usage

```vue
<template>
  <Suspense>
    <!-- Default slot: the async content -->
    <AsyncDashboard />

    <!-- Fallback slot: shown while loading -->
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>
```

`Suspense` waits for all async dependencies inside the default slot to resolve before swapping from the fallback to the real content.

## Async setup

A component with `async setup()` (using top-level `await` in `<script setup>`) is automatically a Suspense dependency:

```vue
<!-- UserProfile.vue -->
<script setup>
const user = await fetchUser() // top-level await
const posts = await fetchPosts(user.id)
</script>

<template>
  <h1>{{ user.name }}</h1>
  <PostList :posts="posts" />
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Suspense>
    <UserProfile />
    <template #fallback>Loading profile...</template>
  </Suspense>
</template>
```

## Single root in both slots

Suspense tracks one immediate child per slot. Wrap multiple elements:

```vue
<template>
  <Suspense>
    <div>
      <AsyncHeader />
      <AsyncContent />
    </div>

    <template #fallback>
      <div>
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    </template>
  </Suspense>
</template>
```

## Timeout for re-triggers

When Suspense is already resolved and new async work starts (e.g., switching views), the old content stays visible until a timeout elapses. Set `timeout` to control when the fallback reappears:

```vue
<template>
  <!-- Show fallback after 200ms if the new view hasn't resolved -->
  <Suspense :timeout="200">
    <component :is="currentView" :key="currentView" />
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

## Suspense events

Track loading state programmatically with `@pending`, `@resolve`, and `@fallback`:

```vue
<script setup>
import { ref } from 'vue'
const isLoading = ref(false)
</script>

<template>
  <ProgressBar v-if="isLoading" />

  <Suspense @pending="isLoading = true" @resolve="isLoading = false">
    <AsyncPage />
    <template #fallback><PageSkeleton /></template>
  </Suspense>
</template>
```

## Nesting with RouterView, Transition, KeepAlive

The correct nesting order is RouterView, then Transition, then KeepAlive, then Suspense:

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition mode="out-in">
      <KeepAlive>
        <Suspense>
          <component :is="Component" />
          <template #fallback>Loading...</template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </RouterView>
</template>
```

## Suspense is still experimental

As of Vue 3.5, Suspense works but is marked as experimental. The API could change in future releases. In production, keep Suspense boundaries minimal and document where you use them.
