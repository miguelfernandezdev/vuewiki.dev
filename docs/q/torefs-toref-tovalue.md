---
order: 75
title: "How do toRefs, toRef, and toValue work?"
difficulty: "advanced"
tags: ["reactivity"]
---

These three utilities solve the problem of converting between Vue's reactive types. They're most useful when destructuring reactive objects, writing composables that accept flexible input, or bridging between `reactive()` and `ref()`. See [toRefs](https://vuejs.org/api/reactivity-utilities.html#torefs), [toRef](https://vuejs.org/api/reactivity-utilities.html#toref), and [unref](https://vuejs.org/api/reactivity-utilities.html#unref) in the docs.

## toRefs: destructure reactive without losing reactivity

`reactive()` objects lose reactivity when destructured. `toRefs` converts each property into an individual ref that stays connected to the source:

```ts
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0, name: 'Ana' })

// Wrong: loses reactivity
const { count, name } = state
count++ // doesn't update state.count

// Right: each property becomes a ref
const { count, name } = toRefs(state)
count.value++ // updates state.count
```

This is essential when returning reactive state from composables, so consumers can destructure:

```ts
function useCounter() {
  const state = reactive({ count: 0, doubled: computed(() => state.count * 2) })

  function increment() { state.count++ }

  return { ...toRefs(state), increment }
}

// Consumer can destructure safely
const { count, doubled, increment } = useCounter()
```

## toRef: single property ref

`toRef` creates a ref for one property of a reactive object. Unlike `toRefs`, it works even if the property doesn't exist yet:

```ts
import { reactive, toRef } from 'vue'

const state = reactive({ count: 0 })

const countRef = toRef(state, 'count')
countRef.value++ // updates state.count

// Works with props too
const props = defineProps<{ name: string }>()
const nameRef = toRef(props, 'name')
```

Since Vue 3.3, `toRef` also accepts a getter function:

```ts
const countRef = toRef(() => state.count)
// Read-only ref that tracks the getter
```

## toValue: normalize any reactive input (Vue 3.3+)

`toValue` unwraps refs, calls getter functions, and passes plain values through. It's designed for composables that accept flexible inputs:

```ts
import { toValue } from 'vue'

toValue(ref(1))       // 1
toValue(() => 2)      // 2
toValue(3)            // 3
```

The main use case is composables that accept a ref, a getter, or a plain value:

```ts
import { toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}

// All three work:
useTitle('Static title')
useTitle(titleRef)
useTitle(() => `${page.value} - My App`)
```

## Quick reference

| Utility | Input | Output | Use case |
|---|---|---|---|
| `toRefs(obj)` | `reactive` object | Object of refs | Destructure without losing reactivity |
| `toRef(obj, 'key')` | `reactive` object + key | Single ref | One property as a ref |
| `toRef(() => val)` | Getter function | Read-only ref | Wrap a getter as a ref (3.3+) |
| `toValue(input)` | Ref, getter, or plain value | Unwrapped value | Normalize flexible composable inputs |

## Common pattern: composable with MaybeRefOrGetter

```ts
import { toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

function useFetch(url: MaybeRefOrGetter<string>) {
  const data = ref(null)
  const error = ref(null)

  async function fetchData() {
    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e
    }
  }

  watch(() => toValue(url), fetchData, { immediate: true })

  return { data, error }
}

// Works with all input types:
useFetch('/api/users')
useFetch(urlRef)
useFetch(() => `/api/users/${id.value}`)
```

See also: [Why do I lose reactivity when destructuring a reactive object?](/q/reactive-destructuring-gotcha) · [What is the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [toRefs() — Vue docs](https://vuejs.org/api/reactivity-utilities.html#torefs)
- [toRef() — Vue docs](https://vuejs.org/api/reactivity-utilities.html#toref)
- [Composables guide — Vue docs](https://vuejs.org/guide/reusability/composables.html)
