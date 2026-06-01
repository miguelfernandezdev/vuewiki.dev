---
order: 82
title: "How does Vue batch DOM updates?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
---

Vue doesn't update the DOM on every reactive state change. It batches all synchronous mutations within the same event loop tick and applies them in a single DOM update. Watchers and computed properties also only fire once with the final value, not for each intermediate change.

## Batching in action

```ts
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (val) => {
  console.log('count:', val)
})

function update() {
  count.value = 1
  count.value = 2
  count.value = 3
}

update()
// Logs once: "count: 3"
// NOT three times with 1, 2, 3
```

This is a performance optimization. Without batching, a loop that pushes 1,000 items into a reactive array would trigger 1,000 re-renders. With batching, it renders once.

```ts
const list = reactive<number[]>([])

function addMany() {
  for (let i = 0; i < 1000; i++) {
    list.push(i)
  }
  // One render with all 1,000 items, not 1,000 renders
}
```

## The flush timing

Vue schedules three types of effect flush:

| Flush | When it runs | Used by |
|---|---|---|
| `'pre'` (default for `watch`) | Before DOM update | Watchers that need to run before render |
| `'post'` (default for `watchEffect`) | After DOM update | Effects that read from the DOM |
| `'sync'` | Immediately on each change | Debugging, rare edge cases |

```ts
// Default: fires once per tick, before DOM update
watch(source, handler)

// Post: fires once per tick, after DOM update
watch(source, handler, { flush: 'post' })
watchEffect(handler) // post by default

// Sync: fires on EVERY change, no batching
watch(source, handler, { flush: 'sync' })
```

## Forcing separate batches with nextTick

If you need intermediate states to be processed separately, break them into different ticks:

```ts
import { nextTick } from 'vue'

async function stepByStep() {
  count.value = 1
  await nextTick() // flush: watcher fires with 1, DOM updates

  count.value = 2
  await nextTick() // flush: watcher fires with 2, DOM updates

  count.value = 3
  // watcher fires with 3 at end of this tick
}
```

## Why batching matters for forms

When populating a form from saved data, validation runs once with the complete state instead of firing for each field:

```ts
const form = reactive({ email: '', password: '' })

watch(form, (data) => {
  validateForm(data)
}, { deep: true })

function loadSavedData(saved: { email: string; password: string }) {
  form.email = saved.email
  form.password = saved.password
  // Validation runs ONCE with both fields set
}
```

## flush: 'sync' (use with caution)

Sync watchers bypass batching and fire on every single change. This is useful for debugging but harmful for performance:

```ts
watch(count, (val) => {
  console.log('immediate:', val)
}, { flush: 'sync' })

count.value = 1 // logs: "immediate: 1"
count.value = 2 // logs: "immediate: 2"
count.value = 3 // logs: "immediate: 3"
```

Avoid `flush: 'sync'` in production code. If you think you need it, you probably need to restructure your logic instead.
