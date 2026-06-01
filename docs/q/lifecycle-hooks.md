---
order: 50
title: "What are lifecycle hooks in Vue 3?"
difficulty: "beginner"
tags: ["composition-api", "lifecycle"]
---

Lifecycle hooks let you run code at specific moments in a component's life: when it's created, mounted to the DOM, updated, or destroyed. In the Composition API, you register them as functions inside `<script setup>`.

## The main hooks

```ts
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

onBeforeMount(() => {
  // DOM not available yet
})

onMounted(() => {
  // DOM is ready, safe to access template refs, start timers, fetch data
})

onBeforeUpdate(() => {
  // reactive state changed, DOM not yet re-rendered
})

onUpdated(() => {
  // DOM re-rendered with new state
})

onBeforeUnmount(() => {
  // component still functional, clean up before removal
})

onUnmounted(() => {
  // component removed from DOM, all watchers stopped
})
```

## Lifecycle flow

```
setup()
  │
  ├── onBeforeMount
  ├── onMounted          ← DOM ready
  │
  │   (reactive state changes)
  ├── onBeforeUpdate
  ├── onUpdated          ← DOM re-rendered
  │
  │   (component removed)
  ├── onBeforeUnmount
  └── onUnmounted        ← fully cleaned up
```

## Which hook for what

| Task | Hook |
|---|---|
| Fetch initial data | `onMounted` |
| Access template refs | `onMounted` |
| Start a timer or listener | `onMounted` (clean up in `onUnmounted`) |
| React to DOM changes after update | `onUpdated` |
| Clean up timers, listeners, subscriptions | `onUnmounted` |

## Common pattern: setup + cleanup

```ts
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

## Options API equivalent

If you see older code using Options API, the mapping is direct:

| Composition API | Options API |
|---|---|
| `onBeforeMount` | `beforeMount` |
| `onMounted` | `mounted` |
| `onBeforeUpdate` | `beforeUpdate` |
| `onUpdated` | `updated` |
| `onBeforeUnmount` | `beforeUnmount` |
| `onUnmounted` | `unmounted` |

There is no `onCreated` or `onBeforeCreate` in the Composition API. Code that would go there runs directly in `setup()` (or at the top level of `<script setup>`), since setup itself runs at creation time.
