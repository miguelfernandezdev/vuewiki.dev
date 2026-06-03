---
order: 127
title: "How does computed object stability affect re-renders?"
difficulty: "advanced"
tags: ["performance", "reactivity", "watchers"]
summary: "A computed that returns a new object each time triggers all dependents even if values are identical. Compare manually or return primitives."
---

A [computed](https://vuejs.org/api/reactivity-core.html#computed) property that returns a new object every time creates a new reference on each evaluation. Vue sees a new reference and triggers every watcher, effect, and child component that depends on it, even if the actual values inside the object are identical. For primitives, Vue 3.4+ handles this automatically. For objects, you need to compare manually.

## The problem

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const count = ref(0)

const stats = computed(() => {
  return {
    isEven: count.value % 2 === 0,
    doubled: count.value * 2
  }
})

watchEffect(() => {
  console.log('Stats changed:', stats.value)
})
</script>
```

Every time `count` changes, `stats` returns a brand new object. Vue compares by reference (`===`), sees a different object, and runs the effect. If `count` goes from 0 to 2 to 4, `isEven` is `true` all three times, but the effect fires on each change because the object reference is new.

## Primitive stability (Vue 3.4+)

Vue 3.4 introduced automatic stability for computed properties that return primitives:

```js
const count = ref(0)

const isEven = computed(() => count.value % 2 === 0)

watchEffect(() => console.log(isEven.value))  // true

count.value = 2  // isEven still true → effect does NOT run
count.value = 4  // isEven still true → effect does NOT run
count.value = 3  // isEven now false → effect runs
```

Vue checks `oldValue === newValue` internally. If the primitive hasn't changed, dependents don't re-run. This only works for primitives because `{} === {}` is always `false`.

## Manual comparison for objects

Vue 3.4+ passes the previous value as the first argument to the computed getter:

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const count = ref(0)

const stats = computed((oldValue) => {
  const newValue = {
    isEven: count.value % 2 === 0,
    category: count.value < 10 ? 'small' : 'large'
  }

  if (
    oldValue &&
    oldValue.isEven === newValue.isEven &&
    oldValue.category === newValue.category
  ) {
    return oldValue
  }

  return newValue
})

watchEffect(() => {
  console.log('Stats changed:', stats.value)
  // Only runs when isEven or category actually changes
})
</script>
```

Returning the old reference tells Vue nothing changed. No watchers fire, no child components re-render.

## Always compute before comparing

The comparison must come AFTER the full computation, not before. If you return early, Vue won't track the reactive dependencies accessed during computation:

```js
// BAD: early return skips dependency tracking
const result = computed((oldValue) => {
  if (oldValue && someCondition) {
    return oldValue // count.value never accessed → Vue loses the dependency
  }
  return { doubled: count.value * 2 }
})

// GOOD: compute first, then compare
const result = computed((oldValue) => {
  const newValue = { doubled: count.value * 2 } // dependency tracked
  if (oldValue && oldValue.doubled === newValue.doubled) {
    return oldValue
  }
  return newValue
})
```

Vue tracks dependencies during execution. If the code path skips `count.value`, Vue doesn't know the computed depends on `count` and won't re-evaluate when it changes.

## Deep comparison for complex objects

For objects with many properties or nested structures, use a deep comparison utility:

```js
import { ref, computed } from 'vue'
import { isEqual } from 'lodash-es'

const filters = ref({ category: 'all', sortBy: 'date', page: 1 })

const activeFilters = computed((oldValue) => {
  const newValue = {
    ...filters.value,
    hasFilters: filters.value.category !== 'all' || filters.value.sortBy !== 'date'
  }

  if (oldValue && isEqual(oldValue, newValue)) {
    return oldValue
  }

  return newValue
})
```

The deep comparison has its own cost, so only use it when the downstream effects are more expensive than the comparison itself.

## When to split into primitives instead

Often the best optimization is not returning an object at all:

```js
// Instead of one computed returning an object
const stats = computed(() => ({
  isEven: count.value % 2 === 0,
  doubled: count.value * 2
}))

// Split into separate primitive computeds
const isEven = computed(() => count.value % 2 === 0)
const doubled = computed(() => count.value * 2)
```

Each primitive computed gets Vue 3.4+ automatic stability for free. Components that only use `isEven` won't re-render when `doubled` changes.

## Comparison

| Approach | Stability | Effort |
|---|---|---|
| Object computed (default) | None, new reference every time | Zero |
| Primitive computed (Vue 3.4+) | Automatic | Zero |
| Object computed with manual comparison | Stable when values match | Shallow comparison code |
| Object computed with deep comparison | Stable for nested objects | lodash/custom utility |
| Split into primitive computeds | Automatic per property | Restructure consuming code |

See also: [Why does my computed property not update when a dependency changes?](/q/computed-conditional-dependencies) · [How does Vue batch DOM updates?](/q/dom-update-batching)

## References

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [watchEffect() - Vue docs](https://vuejs.org/api/reactivity-core.html#watcheffect)
- [Computed Best Practices - Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
