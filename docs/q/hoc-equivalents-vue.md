---
order: 135
title: "What are higher-order components (HOC) equivalent in Vue?"
difficulty: "advanced"
tags: ["composition-api", "architecture"]
---

In React, a Higher-Order Component (HOC) is a function that takes a component and returns a new component with added behavior. Vue doesn't use this pattern because the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) solves the same problem more directly. The Vue equivalents are composables (for logic reuse) and renderless components (for logic + slot-based rendering). Both avoid the wrapper nesting, prop collision, and debugging pain that HOCs cause.

## What HOCs solve

The core need is sharing logic across components without duplicating code. For example, adding "loading + error + data" behavior to any component that fetches data, or injecting permissions checks.

In React class components (pre-hooks), HOCs were the only way to do this. In Vue, the Options API had mixins for the same purpose, and they had similar problems: name collisions, unclear data sources, implicit dependencies.

## Composables: the primary replacement

A composable is a function that uses Vue's reactivity APIs and returns reactive state. Components call it directly in `setup()`:

```ts
// composables/useFetch.ts
export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  watch(() => toValue(url), execute, { immediate: true })

  return { data, error, isLoading, execute }
}
```

```vue
<!-- UserList.vue -->
<script setup>
const { data: users, isLoading, error } = useFetch<User[]>('/api/users')
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="error">{{ error.message }}</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

```vue
<!-- ProductList.vue — same composable, different component -->
<script setup>
const { data: products, isLoading } = useFetch<Product[]>('/api/products')
</script>
```

No wrapper component. No hidden props. Each component explicitly calls `useFetch` and decides what to do with the returned state.

## Renderless components: logic + slot rendering

When you need to share both logic AND template structure, a renderless component provides logic through a scoped slot:

```vue
<!-- FetchProvider.vue -->
<script setup lang="ts" generic="T">
const props = defineProps<{ url: string }>()
const { data, error, isLoading } = useFetch<T>(props.url)
</script>

<template>
  <slot :data="data" :error="error" :is-loading="isLoading" />
</template>
```

```vue
<!-- Usage -->
<FetchProvider url="/api/users" v-slot="{ data: users, isLoading }">
  <p v-if="isLoading">Loading...</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</FetchProvider>
```

The component has no template of its own. It provides logic through the slot, and the consumer decides how to render. This is similar to React's render props pattern.

## Why HOCs are problematic in Vue

You can technically write an HOC in Vue:

```ts
import { h } from 'vue'

function withAuth(WrappedComponent) {
  return defineComponent({
    setup(props, { attrs, slots }) {
      const { isAuthenticated } = useAuth()

      return () => {
        if (!isAuthenticated.value) return h('p', 'Not authorized')
        return h(WrappedComponent, attrs, slots)
      }
    }
  })
}

const ProtectedDashboard = withAuth(Dashboard)
```

This works, but it has problems:

```vue
<!-- The component tree shows ProtectedDashboard > Dashboard -->
<!-- In DevTools, the wrapper obscures the real component -->
<!-- Props must pass through the wrapper manually -->
<!-- TypeScript can't infer the wrapped component's props -->
```

The composable version is simpler and has none of these issues:

```vue
<script setup>
const { isAuthenticated } = useAuth()
</script>

<template>
  <Dashboard v-if="isAuthenticated" />
  <p v-else>Not authorized</p>
</template>
```

## Composables vs renderless components vs HOCs

| | Composable | Renderless component | HOC |
|---|---|---|---|
| Reuses | Logic only | Logic + slot template | Logic + wrapping |
| How consumed | Function call in setup | `<Component v-slot>` | Wraps component definition |
| Props visible | Explicit return values | Scoped slot props | Hidden, passed through |
| TypeScript | Full inference | Full inference | Poor inference |
| DevTools | No extra nesting | One extra component | One extra component per HOC |
| Composability | Call multiple composables | Nesting gets verbose | Nesting gets deep |
| Vue idiom | Primary pattern | Useful for libraries | Avoid |

## When to use each

**Composables** cover 90% of logic reuse cases. Use them for data fetching, form validation, timers, event listeners, browser APIs, state management.

**Renderless components** work well in component libraries where you want to provide behavior with customizable rendering. Examples: headless UI libraries, data table providers, form field wrappers.

**HOCs** have no recommended use case in Vue 3. If you're coming from React and reaching for an HOC, use a composable instead.

See also: [What is a composable?](/q/what-is-a-composable) · [What is the difference between Composition API and React Hooks?](/q/composition-api-vs-react-hooks)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Components: Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
