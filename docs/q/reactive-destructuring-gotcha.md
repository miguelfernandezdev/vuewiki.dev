---
order: 31
title: "Why do I lose reactivity when destructuring a reactive object?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
---

Because `reactive()` uses a Proxy to track property access. When you destructure, you extract **plain values** out of the proxy, and the reactive connection is gone.

```ts
const state = reactive({ count: 0, name: 'Vue' })

const { count, name } = state  // count is now just the number 0

state.count++
console.log(count) // still 0, reactivity lost
```

This is especially dangerous when destructuring the return value of a composable:

```ts
function useCounter() {
  const state = reactive({ count: 0 })
  return state
}

const { count } = useCounter() // plain number, not reactive
```

## How to fix it

**Option 1:** Use `toRefs()` to convert each property into a ref before destructuring.

```ts
const state = reactive({ count: 0, name: 'Vue' })
const { count, name } = toRefs(state)

state.count++
console.log(count.value) // 1, reactivity preserved (needs .value now)
```

**Option 2:** Return `toRefs()` from composables so consumers can destructure safely.

```ts
function useCounter() {
  const state = reactive({ count: 0 })
  return toRefs(state)
}

const { count } = useCounter() // ref, reactivity preserved
```

**Option 3:** Skip `reactive()` entirely and use `ref()` for each value.

```ts
const count = ref(0)
const name = ref('Vue')
// No destructuring needed, no gotchas
```

Most teams default to `ref()` for everything precisely to avoid this pitfall.
