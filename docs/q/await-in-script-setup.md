---
order: 57
title: 'Can you use await directly in script setup? When?'
difficulty: 'intermediate'
tags: ['composition-api', 'nuxt', 'vueuse', 'watchers', 'suspense']
summary: 'Yes. The compiler wraps it in async setup(). The catch: the parent must provide a <Suspense> boundary. Nuxt does this automatically.'
---

Yes, you can use top-level `await` in [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html). The compiler wraps the setup block in an `async setup()` function automatically. The catch: async components require a `<Suspense>` boundary in the parent to handle the pending state while the await resolves. Without a `<Suspense>` boundary in a parent component, the async component may not render as expected. Nuxt wraps every page in `<Suspense>` by default, so in Nuxt you can use `await` freely in pages and layouts without thinking about it.

## Basic example

```vue
<!-- UserProfile.vue -->
<script setup>
const response = await fetch('/api/user/1')
const user = await response.json()
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

<PlaygroundLink code="<!-- UserProfile.vue -->
<script setup>
const response = await fetch('/api/user/1')
const user = await response.json()
</script>
&#10;<template>
  <h1>{{ user.name }}</h1>
</template>" />

This compiles to:

```js
export default {
  async setup() {
    const response = await fetch('/api/user/1')
    const user = await response.json()
    return { user }
  }
}
```

The component is now an async component. Vue suspends rendering until setup resolves.

## The Suspense requirement

An async component must have a `<Suspense>` ancestor. Without it, the component stays in a pending state forever:

```vue
<!-- Parent.vue -->
<template>
  <!-- BAD: no Suspense → UserProfile never appears -->
  <UserProfile />

  <!-- GOOD: Suspense handles the pending state -->
  <Suspense>
    <UserProfile />
    <template #fallback>
      <p>Loading profile...</p>
    </template>
  </Suspense>
</template>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <!-- BAD: no Suspense → UserProfile never appears -->
  <UserProfile />
&#10;  <!-- GOOD: Suspense handles the pending state -->
  <Suspense>
    <UserProfile />
    <template #fallback>
      <p>Loading profile...</p>
    </template>
  </Suspense>
</template>" />

&#10;  <!-- GOOD: Suspense handles the pending state -->
  <Suspense>
    <UserProfile />
    <template #fallback>
      <p>Loading profile...</p>
    </template>
  </Suspense>
</template>" />

The `#fallback` slot renders while the async setup is pending. Once the await resolves, Vue swaps in the real content.

## In Nuxt: it just works

Nuxt wraps every page component in `<Suspense>` automatically through `<NuxtPage>`. You don't need to add `<Suspense>` yourself:

```vue
<!-- pages/users/[id].vue — Nuxt page -->
<script setup>
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>

<template>
  <h1>{{ user.name }}</h1>
</template>
```

<PlaygroundLink code="<!-- pages/users/[id].vue — Nuxt page -->
<script setup>
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>
&#10;<template>
  <h1>{{ user.name }}</h1>
</template>" />

This works out of the box because Nuxt's `app.vue` contains `<NuxtPage>`, which internally provides the `<Suspense>` boundary. During SSR, the await resolves on the server. During client navigation, Nuxt shows a loading indicator while the new page's setup resolves.

## Watchers and lifecycle hooks after await

When you use `await`, any code after it runs in a different microtask. Vue's `<script setup>` compiler handles this via `withAsyncContext`, which preserves the component instance across await boundaries. This means `watch()` and lifecycle hooks registered after an `await` DO work correctly.

However, [`getCurrentInstance()`](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) is an internal API that may not be reliable after `await`, so code that depends on it directly could behave unexpectedly.

```vue
<script setup>
// These work — registered before any await
const count = ref(0)
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))

const data = await fetch('/api/data').then((r) => r.json())

// These also work — withAsyncContext preserves the instance
watch(data, (val) => console.log(val)) // works
onMounted(() => console.log('after await')) // works
</script>
```

<PlaygroundLink code="<script setup>
// These work — registered before any await
const count = ref(0)
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))
&#10;const data = await fetch('/api/data').then((r) => r.json())
&#10;// These also work — withAsyncContext preserves the instance
watch(data, (val) => console.log(val)) // works
onMounted(() => console.log('after await')) // works
</script>" />

The recommendation: registering watchers, lifecycle hooks, and composables BEFORE the first `await` is still good practice for readability and clarity. Put reactive declarations at the top, async operations at the bottom.

```vue
<script setup>
// 1. All reactive state and composables first
const count = ref(0)
const items = ref([])
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))

// 2. Async operations last
const response = await fetch('/api/data')
items.value = await response.json()
</script>
```

<PlaygroundLink code="<script setup>
// 1. All reactive state and composables first
const count = ref(0)
const items = ref([])
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))
&#10;// 2. Async operations last
const response = await fetch('/api/data')
items.value = await response.json()
</script>" />

## When to use await vs useFetch

In Nuxt, prefer `useFetch` over raw `await fetch()`:

```vue
<script setup>
// Prefer this — handles SSR payload, caching, cancellation
const { data } = await useFetch('/api/users')

// Avoid this — no payload transfer, double-fetches on hydration
const data = ref(await fetch('/api/users').then((r) => r.json()))
</script>
```

<PlaygroundLink code="<script setup>
// Prefer this — handles SSR payload, caching, cancellation
const { data } = await useFetch('/api/users')
&#10;// Avoid this — no payload transfer, double-fetches on hydration
const data = ref(await fetch('/api/users').then((r) => r.json()))
</script>" />

Both use `await`, but `useFetch` integrates with Nuxt's payload system. Raw `fetch` runs again on the client during hydration.

## When NOT to use await in setup

**Data that loads after user interaction**: use `$fetch` in event handlers or `useFetch` with `immediate: false`.

**Data from multiple independent sources**: parallel fetches are better than sequential awaits.

```vue
<script setup>
// BAD: sequential — total time = A + B
const users = await useFetch('/api/users')
const posts = await useFetch('/api/posts')

// GOOD: parallel — total time = max(A, B)
const [{ data: users }, { data: posts }] = await Promise.all([
  useFetch('/api/users'),
  useFetch('/api/posts')
])
</script>
```

<PlaygroundLink code="<script setup>
// BAD: sequential — total time = A + B
const users = await useFetch('/api/users')
const posts = await useFetch('/api/posts')
&#10;// GOOD: parallel — total time = max(A, B)
const [{ data: users }, { data: posts }] = await Promise.all([
  useFetch('/api/users'),
  useFetch('/api/posts')
])
</script>" />

## Summary

| Context                      | await in setup works?    | Suspense needed?             |
| ---------------------------- | ------------------------ | ---------------------------- |
| Nuxt page/layout             | Yes                      | No (automatic)               |
| Nuxt component inside a page | Yes                      | Yes (add Suspense in parent) |
| Plain Vue (no Nuxt)          | Yes                      | Yes (you must add it)        |
| Inside event handler         | N/A (use $fetch instead) | No                           |

See also: [What are lifecycle hooks in Vue 3?](/q/lifecycle-hooks) · [What is script setup?](/q/script-setup)

## References

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [getCurrentInstance](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) - Vue.js docs
