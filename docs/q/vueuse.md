---
order: 93
title: 'What is VueUse and what are its most useful composables?'
difficulty: 'intermediate'
tags: ['composables', 'tooling', 'pinia', 'vueuse', 'watchers', 'v-model']
summary: 'A collection of 200+ composables for common tasks: browser APIs, sensors, state, network. Install @vueuse/core and use them directly.'
---

VueUse is a collection of composables for common tasks: browser APIs, sensors, state, animations, network, and more. Instead of writing your own `useLocalStorage` or `useDebounceFn` from scratch, you install `@vueuse/core` and get 200+ battle-tested composables that work with Vue 3's reactivity system.

```bash
npm install @vueuse/core
```

## Most useful composables by category

### Browser and DOM

**useLocalStorage / useSessionStorage**: reactive storage that syncs automatically.

```ts
const theme = useLocalStorage('theme', 'light')
theme.value = 'dark' // saved to localStorage immediately
```

**useClipboard**: copy to clipboard.

```ts
const { copy, copied } = useClipboard()
await copy('Hello!')
// copied.value is true for 1.5 seconds
```

**useMediaQuery**: reactive CSS media query.

```ts
const isMobile = useMediaQuery('(max-width: 768px)')
```

**useDark**: dark mode with persistence.

```ts
const isDark = useDark()
const toggle = useToggle(isDark)
```

**useEventListener**: auto-cleaned event listeners.

```ts
useEventListener(window, 'resize', () => {
  console.log(window.innerWidth)
})
// listener removed automatically when component unmounts
```

### State

**useToggle**: boolean toggle.

```ts
const [value, toggle] = useToggle(false)
toggle() // true
toggle() // false
```

**useDebounceFn / useThrottleFn**: debounce and throttle.

```ts
const search = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)
```

**createGlobalState**: shared state across components without Pinia.

```ts
const useGlobalCounter = createGlobalState(() => {
  const count = ref(0)
  return { count }
})
```

### Network

**useFetch**: reactive fetch wrapper (different from Nuxt's useFetch).

```ts
const { data, error, isFetching } = useFetch('https://api.example.com/posts')
  .get()
  .json<Post[]>()
```

**useWebSocket**: reactive WebSocket connection.

```ts
const { data, send, status } = useWebSocket('wss://example.com/ws')

watch(data, (message) => {
  console.log('Received:', message)
})
```

### Sensors

**useMouse**: reactive mouse position.

```ts
const { x, y } = useMouse()
```

**useIntersectionObserver**: detect element visibility.

```ts
const target = ref<HTMLElement>()
const isVisible = ref(false)

useIntersectionObserver(target, ([entry]) => {
  isVisible.value = entry.isIntersecting
})
```

**useElementSize**: reactive element dimensions.

```ts
const el = ref<HTMLElement>()
const { width, height } = useElementSize(el)
```

### Utilities

**watchDebounced**: debounced watcher.

```ts
const search = ref('')

watchDebounced(
  search,
  (value) => {
    fetchResults(value)
  },
  { debounce: 300 }
)
```

**whenever**: watch that fires only when value is truthy.

```ts
const isReady = ref(false)

whenever(isReady, () => {
  console.log('Ready!')
})
```

**useAsyncState**: run async function with reactive loading/error state.

```ts
const { state, isLoading, error } = useAsyncState(
  () => fetch('/api/user').then((r) => r.json()),
  null // initial state
)
```

## Using in a real component

```vue
<script setup>
import { useLocalStorage, useDebounceFn, useMediaQuery } from '@vueuse/core'

const searchQuery = useLocalStorage('search', '')
const isMobile = useMediaQuery('(max-width: 768px)')

const debouncedSearch = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)

watch(searchQuery, (q) => debouncedSearch(q))
</script>

<template>
  <input
    v-model="searchQuery"
    :placeholder="isMobile ? 'Search...' : 'Search articles...'"
  />
</template>
```

<PlaygroundLink code="<script setup>
import { useLocalStorage, useDebounceFn, useMediaQuery } from '@vueuse/core'
&#10;const searchQuery = useLocalStorage('search', '')
const isMobile = useMediaQuery('(max-width: 768px)')
&#10;const debouncedSearch = useDebounceFn((query: string) => {
  fetchResults(query)
}, 300)
&#10;watch(searchQuery, (q) => debouncedSearch(q))
</script>
&#10;<template>
  <input
    v-model=&quot;searchQuery&quot;
    :placeholder=&quot;isMobile ? 'Search...' : 'Search articles...'&quot;
  />
</template>" />

</template>" />

## VueUse vs writing your own

Write your own composable when the logic is specific to your domain. Use VueUse when the problem is generic (debounce, storage, media queries, clipboard, intersection observer). VueUse composables handle edge cases, SSR compatibility, and cleanup that you would otherwise have to implement yourself.

See also: [What is a composable?](/q/what-is-a-composable) · [How would you build a composable for data fetching?](/q/composable-data-fetching) · [How would you implement debounce?](/q/debounce-search-input)

## References

- [VueUse](https://vueuse.org/) - VueUse docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
