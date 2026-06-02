---
order: 85
title: "What is the difference between Composition API and React Hooks?"
difficulty: "advanced"
tags: ["composition-api", "watchers"]
---

They look similar on the surface — both extract reusable logic into functions. But they have a fundamental difference: Vue's `setup` runs **once** per component instance, while React's component function runs on **every render**. This single difference eliminates entire categories of bugs and unnecessary patterns that React developers deal with daily.

## setup runs once

```vue
<script setup>
import { ref, watchEffect } from 'vue'

// This code runs ONCE when the component is created
const count = ref(0)
console.log('setup') // logs once

watchEffect(() => {
  // This runs when dependencies change, not on every render
  console.log(count.value)
})
</script>
```

In React, the equivalent component function re-executes on every state change, every prop change, every parent re-render. That creates problems Vue doesn't have.

## No stale closures

In React, functions capture the state value at the time of the render. If a `setTimeout` fires later, it sees an old value ("stale closure"). In Vue, `ref.value` always reads the current value:

```ts
// Vue: always current
const count = ref(0)

onMounted(() => {
  setInterval(() => {
    console.log(count.value) // always the latest value
  }, 1000)
})
```

```tsx
// React: stale closure problem
const [count, setCount] = useState(0)

useEffect(() => {
  setInterval(() => {
    console.log(count) // captures the value from the render when useEffect ran
  }, 1000)
}, []) // missing dep, always logs 0
```

## No dependency arrays

Vue tracks reactive dependencies automatically. You don't need to list them:

```ts
// Vue: auto-tracking
watchEffect(() => {
  fetchResults(query.value, filter.value)
  // Vue knows this depends on query and filter
})

// React: manual dependency array
useEffect(() => {
  fetchResults(query, filter)
}, [query, filter]) // forget one → stale data, add wrong one → infinite loop
```

## No useCallback / useMemo

React re-creates functions on every render, so you wrap them in `useCallback` to prevent child re-renders. Vue functions are created once in `setup` and never recreated:

```ts
// Vue: just define the function
function handleClick() {
  count.value++
}
// pass it to children, no wrapper needed

// React: needs memoization
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])
```

Same for expensive computations. Vue's `computed` tracks deps and caches automatically. React needs `useMemo` with a dependency array.

## Composables can be conditional

React Hooks must be called in the same order on every render (no conditionals, no loops, no early returns before hooks). Vue composables have no such restriction because `setup` runs once:

```ts
// Vue: perfectly fine
if (featureEnabled) {
  const { data } = useSomeFeature()
}

// React: "Hooks cannot be called conditionally"
```

## Side-by-side comparison

| Concern | Vue Composition API | React Hooks |
|---|---|---|
| Execution | `setup` runs once | Component function runs every render |
| Stale closures | Not possible (ref.value is always current) | Common bug, needs workarounds |
| Dependency tracking | Automatic | Manual arrays, lint rules |
| Function memoization | Not needed | `useCallback` required for performance |
| Value memoization | `computed()` auto-tracks | `useMemo` with dependency array |
| Conditional usage | Allowed | Forbidden (rules of hooks) |
| Re-render scope | Fine-grained (only what changed) | Entire component tree by default |

## React patterns to avoid in Vue

If you're coming from React, drop these habits:

- Don't wrap functions in computed to "memoize" them. Just define the function.
- Don't create explicit dependency arrays for `watchEffect`. It tracks automatically.
- Don't worry about closure staleness. `ref.value` is always current.
- Don't add `React.memo`-style optimizations. Vue's reactivity is already fine-grained.

See also: [What is the Composition API and how does it differ from the Options API?](/q/composition-api-vs-options-api) · [What is a composable?](/q/what-is-a-composable)

## References

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [computed](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
