---
order: 145
title: 'What are Suspense SSR hydration issues and how do you work around them?'
difficulty: 'advanced'
tags: ['ssr', 'components', 'vueuse', 'suspense']
summary: "During hydration, async component chunks may not be loaded yet, causing mismatches. Prefetch chunks or use Nuxt's built-in Suspense handling."
---

`<Suspense>` and SSR have known edge cases. The core problem: during hydration, an async component's chunk might not be loaded yet, so the client renders the fallback while the server sent the resolved content. This creates a hydration mismatch that causes flickering, state loss, or runtime errors.

## How the problem happens

```
1. Server resolves the async component, renders its full HTML
2. Browser shows that HTML immediately
3. JavaScript loads, Vue starts hydrating
4. The async component's chunk hasn't loaded yet
5. Vue sees Suspense with an unresolved child — shows fallback
6. Full HTML flickers to "Loading..." skeleton
7. Chunk loads, component renders again
```

The user sees content, then a flash of loading state, then content again.

<img src="/diagrams/en/suspense-ssr-hydration.svg" alt="Sequence diagram showing the Suspense hydration flicker: async chunk not loaded causes fallback to show briefly" style="max-width: 100%;" />

## Problem code

```vue
<script setup>
const AsyncDashboard = defineAsyncComponent(() => import('./Dashboard.vue'))
</script>

<template>
  <Suspense>
    <AsyncDashboard />
    <template #fallback>Loading...</template>
  </Suspense>
</template>
```

<PlaygroundLink code="<script setup>
const AsyncDashboard = defineAsyncComponent(() => import('./Dashboard.vue'))
</script>
&#10;<template>
  <Suspense>
    <AsyncDashboard />
    <template #fallback>Loading...</template>
  </Suspense>
</template>" />

This works in CSR but causes hydration flicker in SSR because the chunk might not be ready when hydration starts.

## Solution 1: use async setup instead of defineAsyncComponent

Components with `await` in `<script setup>` are inherently async and work better with Suspense in SSR because Nuxt preloads their data during server rendering:

```vue
<!-- Dashboard.vue -->
<script setup>
const { data } = await useFetch('/api/dashboard')
</script>

<template>
  <div>{{ data }}</div>
</template>
```

<PlaygroundLink code="<script setup>
const { data } = await useFetch('/api/dashboard')
</script>
&#10;<template>
  <div>{{ data }}</div>
</template>" />

```vue
<!-- Parent.vue -->
<template>
  <Suspense>
    <Dashboard />
    <template #fallback><DashboardSkeleton /></template>
  </Suspense>
</template>
```

<PlaygroundLink code="<template>
  <Suspense>
    <Dashboard />
    <template #fallback><DashboardSkeleton /></template>
  </Suspense>
</template>" />

The data is serialized in the payload, so hydration has everything it needs without waiting for a separate chunk.

## Solution 2: wrap with ClientOnly

For components where SSR is not critical, skip server rendering entirely:

```vue
<template>
  <ClientOnly>
    <Suspense>
      <AsyncDashboard />
      <template #fallback>Loading dashboard...</template>
    </Suspense>
    <template #fallback>
      <DashboardSkeleton />
    </template>
  </ClientOnly>
</template>
```

<PlaygroundLink code="<template>
  <ClientOnly>
    <Suspense>
      <AsyncDashboard />
      <template #fallback>Loading dashboard...</template>
    </Suspense>
    <template #fallback>
      <DashboardSkeleton />
    </template>
  </ClientOnly>
</template>" />

The server renders the skeleton. The client loads and resolves the async component. No hydration mismatch because the server never rendered the real content.

## Solution 3: separate Suspense per component

Instead of one Suspense wrapping everything, give each async section its own boundary:

```vue
<template>
  <div class="dashboard">
    <Suspense>
      <AsyncHeader />
      <template #fallback><HeaderSkeleton /></template>
    </Suspense>

    <Suspense>
      <AsyncStats />
      <template #fallback><StatsSkeleton /></template>
    </Suspense>

    <Suspense>
      <AsyncTable />
      <template #fallback><TableSkeleton /></template>
    </Suspense>
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div class=&quot;dashboard&quot;>
    <Suspense>
      <AsyncHeader />
      <template #fallback><HeaderSkeleton /></template>
    </Suspense>
&#10;    <Suspense>
      <AsyncStats />
      <template #fallback><StatsSkeleton /></template>
    </Suspense>
&#10;    <Suspense>
      <AsyncTable />
      <template #fallback><TableSkeleton /></template>
    </Suspense>
  </div>
</template>" />

Each section resolves independently. A slow chunk only affects its own Suspense boundary, not the entire page.

## Solution 4: avoid useQuery after await

With data-fetching libraries like TanStack Query, all `useQuery` calls must come BEFORE any `await`. Vue's composition context is lost after an `await`, and queries set up after it won't integrate with Suspense correctly:

```vue
<script setup>
// All queries BEFORE await
const { data, suspense } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
  staleTime: 5 * 60 * 1000
})

// Await AFTER all queries are set up
await suspense()
</script>
```

<PlaygroundLink code="<script setup>
// All queries BEFORE await
const { data, suspense } = useQuery({
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
  staleTime: 5 * 60 * 1000
})
&#10;// Await AFTER all queries are set up
await suspense()
</script>" />

Setting a proper `staleTime` prevents the client from refetching data that was already fetched on the server.

## Common issues reference

| Symptom                                | Cause                                      | Fix                                       |
| -------------------------------------- | ------------------------------------------ | ----------------------------------------- |
| Content flickers to loading then back  | Async chunk not ready at hydration         | Use async setup, or ClientOnly            |
| Blank flash on Safari                  | Slower chunk loading on Safari             | Preload critical chunks, use skeletons    |
| "Hydration mismatch" warning           | Server and client render different content | Match fallback structure to server output |
| Data fetched twice                     | staleTime not set, client refetches        | Set staleTime on queries                  |
| "Cannot access composable" after await | useQuery called after await                | Move all composable calls before await    |

See also: [How does Suspense work?](/q/suspense) · [What are async components?](/q/async-components)

## References

- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Client Hydration](https://vuejs.org/guide/scaling-up/ssr.html#client-hydration) - Vue.js docs
