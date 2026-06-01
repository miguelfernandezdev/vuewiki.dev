---
order: 54
title: "What is conditional rendering in Vue?"
difficulty: "beginner"
tags: ["directives"]
---

Conditional rendering controls whether elements appear in the DOM based on reactive state. Vue provides two mechanisms: `v-if` (adds/removes elements) and `v-show` (toggles CSS `display`).

## v-if, v-else-if, v-else

These directives add or remove elements from the DOM entirely.

```vue
<template>
  <div v-if="status === 'loading'">Loading...</div>
  <div v-else-if="status === 'error'">Something went wrong</div>
  <div v-else>{{ data }}</div>
</template>

<script setup>
import { ref } from 'vue'

const status = ref('loading')
const data = ref(null)
</script>
```

The elements must be siblings. You can't put other elements between `v-if` and `v-else`:

```vue
<!-- Wrong: the <hr> breaks the chain -->
<div v-if="ok">Yes</div>
<hr />
<div v-else>No</div>

<!-- Right: siblings, no gap -->
<div v-if="ok">Yes</div>
<div v-else>No</div>
```

## v-if on template

To conditionally render multiple elements without adding a wrapper to the DOM:

```vue
<template v-if="loggedIn">
  <h1>Welcome back</h1>
  <p>Your dashboard is ready</p>
</template>
```

## v-show

`v-show` keeps the element in the DOM and toggles `display: none`.

```vue
<div v-show="isVisible">Always in the DOM, just hidden</div>
```

## v-if vs v-show

| | `v-if` | `v-show` |
|---|---|---|
| DOM behavior | Adds/removes elements | Toggles `display: none` |
| Initial render cost | Cheaper if condition is false (nothing rendered) | Always rendered |
| Toggle cost | Expensive (destroy + recreate) | Cheap (CSS only) |
| Supports `<template>` | Yes | No |
| Supports `v-else` | Yes | No |
| Triggers lifecycle hooks | Yes, on every toggle | Only on first render |

**Rule of thumb:** use `v-show` for things the user toggles frequently (tabs, dropdowns, tooltips). Use `v-if` for conditions that rarely change or when you want to avoid rendering cost upfront.

## Common gotcha: v-if with v-for

Never put `v-if` and `v-for` on the same element. In Vue 3, `v-if` has higher precedence, so it runs before `v-for` and can't access the iteration variable.

```vue
<!-- Wrong: v-if can't see "item" -->
<li v-for="item in items" v-if="item.active" :key="item.id">
  {{ item.name }}
</li>

<!-- Right: filter with computed -->
<li v-for="item in activeItems" :key="item.id">
  {{ item.name }}
</li>
```

```ts
const activeItems = computed(() => items.value.filter(i => i.active))
```
