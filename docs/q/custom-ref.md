---
order: 88
title: 'What is customRef and when would you use one?'
difficulty: 'advanced'
tags: ['reactivity', 'v-model']
summary: 'customRef lets you control when track() and trigger() fire, enabling debounced, validated, or localStorage-synced refs.'
---

[customRef](https://vuejs.org/api/reactivity-advanced.html#customref) creates a ref where you control when dependency tracking (`track`) and update triggering (`trigger`) happen. Normal refs track on every read and trigger on every write automatically. With `customRef`, you insert your own logic between the read/write and the reactivity system. The classic use case is a debounced ref that delays triggering updates until the user stops typing.

## How it works

`customRef` takes a factory function that receives `track` and `trigger` callbacks, and returns an object with `get` and `set`:

```ts
import { customRef } from 'vue'

function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>
  let value = initialValue

  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    }
  }))
}
```

```vue
<script setup>
const searchQuery = useDebouncedRef('', 500)
</script>

<template>
  <!-- Typing updates the internal value immediately,
       but watchers and computed only fire after 500ms of inactivity -->
  <input v-model="searchQuery" placeholder="Search..." />
  <p>Debounced value: {{ searchQuery }}</p>
</template>
```

<PlaygroundLink code="<script setup>
const searchQuery = useDebouncedRef('', 500)
</script>
&#10;<template>
&#10;  <input v-model=&quot;searchQuery&quot; placeholder=&quot;Search...&quot; />
  <p>Debounced value: {{ searchQuery }}</p>
</template>" />

Every keystroke resets the debounce timer. The internal `value` and `trigger()` are only called after the user stops typing for 500ms. That means watchers, computed properties, and template re-renders all wait.

## track() and trigger() explained

These two functions are the same mechanism that `ref` uses internally:

- **`track()`**: tells Vue "this ref was read, so whatever is reading it should be notified when it changes." Call this in `get()`.
- **`trigger()`**: tells Vue "this ref changed, re-run everything that depends on it." Call this in `set()`, but only when you decide the update should happen.

A normal `ref` calls `track` in every `get` and `trigger` in every `set`. `customRef` lets you skip, delay, or conditionally call either one.

## Validated ref

A ref that rejects invalid values:

```ts
function useValidatedRef(initial: number, min: number, max: number) {
  let value = initial

  return customRef<number>((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      if (newValue >= min && newValue <= max) {
        value = newValue
        trigger()
      }
      // invalid values are silently ignored — no trigger, no re-render
    }
  }))
}

const quantity = useValidatedRef(1, 1, 99)
quantity.value = 50 // works, triggers update
quantity.value = 200 // ignored, nothing happens
quantity.value = -5 // ignored, nothing happens
```

## Ref with local storage sync

Persist a ref's value to `localStorage` and hydrate it on read:

```ts
function useLocalStorageRef<T>(key: string, defaultValue: T) {
  return customRef<T>((track, trigger) => ({
    get() {
      track()
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    },
    set(newValue) {
      localStorage.setItem(key, JSON.stringify(newValue))
      trigger()
    }
  }))
}

const theme = useLocalStorageRef<'light' | 'dark'>('theme', 'light')
```

Every read goes through `localStorage`, so even if another tab changes the value, this tab picks it up on the next read. The `set` writes to both `localStorage` and triggers Vue's reactivity.

## When to use customRef vs alternatives

| Need                              | Solution                           |
| --------------------------------- | ---------------------------------- |
| Delay updates (debounce/throttle) | `customRef`                        |
| Validate before updating          | `customRef` or a setter composable |
| Sync with external storage        | `customRef`                        |
| Transform values on read/write    | `computed` with getter/setter      |
| React to changes after the fact   | `watch`                            |
| Derive a value from other refs    | `computed`                         |

`customRef` is for cases where you need to control the reactivity pipeline itself. If you just need to transform or derive values, `computed` is simpler.

## Rules

1. Always call `track()` in `get()`. If you don't, dependents won't know to re-run when the value changes.
2. Call `trigger()` only when you want to notify dependents. This is the whole point.
3. Don't call `trigger()` inside `get()`. It creates an infinite loop.
4. The factory function runs once. The `get`/`set` closures capture `track` and `trigger` permanently.

See also: [What is nextTick and when do you need it?](/q/nexttick) · [When would you use shallowRef / shallowReactive?](/q/shallow-ref-reactive)

## References

- [customRef() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#customref)
- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactivity in Depth - Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
