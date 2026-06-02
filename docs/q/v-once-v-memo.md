---
order: 83
title: "What is v-once and v-memo? When should you use them?"
difficulty: "advanced"
tags: ["directives", "performance"]
---

`v-once` renders an element once and skips all future updates. `v-memo` conditionally skips re-renders based on a dependency array. Both reduce render work by telling Vue that certain parts of the template don't need to be re-evaluated.

## v-once

Marks content as static after the first render. Vue creates the vnode once and reuses it on every subsequent update.

```vue
<template>
  <!-- Rendered once, never re-evaluated -->
  <footer v-once>
    <p>Copyright {{ year }} {{ company }}</p>
  </footer>
</template>

<script setup>
const year = 2024
const company = 'Acme Corp'
</script>
```

Even though `year` and `company` are interpolated at runtime, `v-once` tells Vue their values will never change, so the subtree is frozen after the first render.

## v-memo

Memoizes a subtree based on a dependency array. Vue skips re-rendering when all values in the array are the same as the previous render. This is most useful inside `v-for` loops.

```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.id === selectedId]"
  >
    <div :class="{ selected: item.id === selectedId }">
      <ExpensiveComponent :data="item" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([/* 1,000 items */])
const selectedId = ref<number | null>(null)
</script>
```

When `selectedId` changes, only two items re-render: the previously selected one (true to false) and the newly selected one (false to true). The other 998 items are skipped entirely.

## v-memo with multiple dependencies

```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.id === selectedId, item.id === editingId]"
  >
    <ItemCard
      :item="item"
      :selected="item.id === selectedId"
      :editing="item.id === editingId"
    />
  </div>
</template>
```

The item re-renders only when its selection or editing state changes.

## v-memo with empty array

`v-memo="[]"` is equivalent to `v-once`: the dependency array never changes, so the content is never re-rendered.

```vue
<div v-for="item in staticList" :key="item.id" v-memo="[]">
  {{ item.name }}
</div>
```

## When NOT to use them

```vue
<template>
  <!-- Wrong: count will never update in the UI -->
  <div v-once>
    <span>Count: {{ count }}</span>
  </div>

  <!-- Wrong: v-model inside memoized subtree won't work properly -->
  <div v-memo="[selected]">
    <input v-model="item.name" />
  </div>

  <!-- Pointless: overhead of memoization exceeds the cost of re-rendering a <span> -->
  <span v-once>{{ label }}</span>
</template>
```

## When to use which

| Scenario | Use |
|---|---|
| Content that uses runtime data but never changes after mount | `v-once` |
| Large list where only a few items change at a time | `v-memo` with the changing condition |
| Completely static markup (no interpolation) | Neither, the compiler already hoists it |
| Content with interactive children (inputs, v-model) | Neither, they need to re-render |
| Small, simple elements | Neither, the optimization isn't worth it |

Profile with Vue DevTools before adding these directives. They're a targeted optimization for measured bottlenecks, not something to sprinkle everywhere.

See also: [How would you optimize performance in a Vue app?](/q/performance-optimization) · [How would you diagnose a slow page?](/q/diagnose-slow-page) · [How do props stability optimizations work?](/q/perf-props-stability)

## References

- [v-once](https://vuejs.org/api/built-in-directives.html#v-once) - Vue.js docs
- [v-memo](https://vuejs.org/api/built-in-directives.html#v-memo) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
