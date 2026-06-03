---
order: 41
title: 'How does Suspense work for async components?'
difficulty: 'intermediate'
tags: ['components', 'slots', 'suspense', 'teleport']
summary: '<Suspense> renders fallback content while async children resolve. Works with defineAsyncComponent and components with async setup().'
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

<PlaygroundLink code="<template>
  <Suspense>
    <!-- Default slot: the async content -->
    <AsyncDashboard />
&#10;    <!-- Fallback slot: shown while loading -->
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>" />

&#10;    <!-- Fallback slot: shown while loading -->
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>" />

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

<PlaygroundLink code="<!-- UserProfile.vue -->
<script setup>
const user = await fetchUser() // top-level await
const posts = await fetchPosts(user.id)
</script>
&#10;<template>
  <h1>{{ user.name }}</h1>
  <PostList :posts=&quot;posts&quot; />
</template>" />

</template>" />

```vue
<!-- Parent.vue -->
<template>
  <Suspense>
    <UserProfile />
    <template #fallback>Loading profile...</template>
  </Suspense>
</template>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <Suspense>
    <UserProfile />
    <template #fallback>Loading profile...</template>
  </Suspense>
</template>" />

    <template #fallback>Loading profile...</template>
  </Suspense>
</template>" />

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

<PlaygroundLink code="<template>
  <Suspense>
    <div>
      <AsyncHeader />
      <AsyncContent />
    </div>
&#10;    <template #fallback>
      <div>
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    </template>
  </Suspense>
</template>" />

      <AsyncContent />
    </div>
&#10;    <template #fallback>
      <div>
        <LoadingSpinner />
        <p>Loading...</p>
      </div>
    </template>
  </Suspense>
</template>" />

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

<PlaygroundLink code="<template>
  <!-- Show fallback after 200ms if the new view hasn't resolved -->
  <Suspense :timeout=&quot;200&quot;>
    <component :is=&quot;currentView&quot; :key=&quot;currentView&quot; />
    <template #fallback>Loading...</template>
  </Suspense>
</template>" />

    <template #fallback>Loading...</template>
  </Suspense>
</template>" />

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

<PlaygroundLink code="<script setup>
import { ref } from 'vue'
const isLoading = ref(false)
</script>
&#10;<template>
  <ProgressBar v-if=&quot;isLoading&quot; />
&#10;  <Suspense @pending=&quot;isLoading = true&quot; @resolve=&quot;isLoading = false&quot;>
    <AsyncPage />
    <template #fallback><PageSkeleton /></template>
  </Suspense>
</template>" />

&#10;  <Suspense @pending=&quot;isLoading = true&quot; @resolve=&quot;isLoading = false&quot;>
    <AsyncPage />
    <template #fallback><PageSkeleton /></template>
  </Suspense>
</template>" />

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

<PlaygroundLink code="<template>
  <RouterView v-slot=&quot;{ Component }&quot;>
    <Transition mode=&quot;out-in&quot;>
      <KeepAlive>
        <Suspense>
          <component :is=&quot;Component&quot; />
          <template #fallback>Loading...</template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </RouterView>
</template>" />

          <template #fallback>Loading...</template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </RouterView>
</template>" />

## Suspense is still experimental

Suspense is still an experimental API. It works, but the API could change in future releases. In production, keep Suspense boundaries minimal and document where you use them.

See also: [What are async components?](/q/async-components) · [What are Teleport, Fragments, and Suspense?](/q/teleport-fragments-suspense) · [How does error handling work?](/q/error-handling)

## References

- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
