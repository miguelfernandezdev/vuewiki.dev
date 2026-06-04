---
order: 55
title: 'What are lifecycle hooks in Vue 3?'
difficulty: 'beginner'
tags: ['composition-api', 'lifecycle']
summary: 'onMounted (DOM ready), onUpdated (after re-render), onUnmounted (cleanup), onBeforeMount, onBeforeUpdate, onBeforeUnmount. Registered inside setup().'
---

Lifecycle hooks let you run code at specific moments in a component's life: when it's created, mounted to the DOM, updated, or destroyed. In the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html), you register them as functions inside [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html).

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

<img src="/diagrams/en/lifecycle.svg" alt="Flowchart of Vue 3 lifecycle hooks from setup through onMounted, onUpdated, and onUnmounted" style="max-width: 100%;" />

## Which hook for what

| Task                                      | Hook                                    |
| ----------------------------------------- | --------------------------------------- |
| Fetch initial data                        | `onMounted`                             |
| Access template refs                      | `onMounted`                             |
| Start a timer or listener                 | `onMounted` (clean up in `onUnmounted`) |
| React to DOM changes after update         | `onUpdated`                             |
| Clean up timers, listeners, subscriptions | `onUnmounted`                           |

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

| Composition API   | Options API     |
| ----------------- | --------------- |
| `onBeforeMount`   | `beforeMount`   |
| `onMounted`       | `mounted`       |
| `onBeforeUpdate`  | `beforeUpdate`  |
| `onUpdated`       | `updated`       |
| `onBeforeUnmount` | `beforeUnmount` |
| `onUnmounted`     | `unmounted`     |

There is no `onCreated` or `onBeforeCreate` in the Composition API. Code that would go there runs directly in `setup()` (or at the top level of `<script setup>`), since setup itself runs at creation time.

See also: [What is the Composition API and how does it differ from the Options API?](/q/composition-api-vs-options-api) · [Can you use await directly in script setup?](/q/await-in-script-setup)

## References

- [onMounted](https://vuejs.org/api/composition-api-lifecycle.html#onmounted) - Vue.js docs
- [Lifecycle Hooks guide](https://vuejs.org/guide/essentials/lifecycle.html) - Vue.js docs
- [Composition API: Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html) - Vue.js docs
