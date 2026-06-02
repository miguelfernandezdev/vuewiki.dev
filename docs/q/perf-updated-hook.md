---
order: 128
title: "When should you use the updated hook and what are its performance implications?"
difficulty: "advanced"
tags: ["performance", "reactivity", "watchers"]
---

The `updated` hook (`onUpdated` in Composition API) runs after every reactive state change that causes a re-render. It fires for ANY state change in the component, not just the one you care about. This makes it a dangerous place for expensive operations, API calls, or state mutations. For most use cases, [watch](https://vuejs.org/api/reactivity-core.html#watch) or [computed](https://vuejs.org/api/reactivity-core.html#computed) is a better choice.

## How updated works

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const name = ref('Alice')
const count = ref(0)

onUpdated(() => {
  console.log('Component re-rendered')
  // Fires when name OR count changes
  // You don't know which one triggered it
})
</script>
```

The hook has no information about what changed. It just tells you the DOM was patched. If the component has 10 reactive properties, the hook fires when any of them changes.

## The dangers

### Infinite loops from state mutation

```js
// BAD: mutating state inside updated triggers another update
export default {
  data() {
    return { renderCount: 0 }
  },
  updated() {
    this.renderCount++ // triggers re-render → updated → renderCount++ → ...
  }
}
```

State changes inside `updated` cause another render, which calls `updated` again. The browser locks up.

### API calls on every render

```js
// BAD: fires on every re-render, not just when items change
export default {
  data() {
    return { items: [], searchQuery: '' }
  },
  updated() {
    fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(this.items)
    })
  }
}
```

Typing in the search field triggers a re-render, which fires `updated`, which sends an API call. Every keystroke hits the server, even though `items` didn't change.

### Derived data in updated

```js
// BAD: causes another update cycle
export default {
  data() {
    return { numbers: [1, 2, 3, 4, 5] }
  },
  updated() {
    this.sum = this.numbers.reduce((a, b) => a + b, 0)
  }
}
```

Setting `this.sum` triggers a re-render, which triggers `updated` again. Even if it doesn't infinite loop (because the value stabilizes), you get an unnecessary extra render cycle.

## Use watch instead

Watchers are targeted. They fire only when the specific data you're watching changes:

```vue
<script setup>
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const items = ref([])

const syncToServer = useDebounceFn((newItems) => {
  fetch('/api/sync', { method: 'POST', body: JSON.stringify(newItems) })
}, 500)

watch(items, (newItems) => {
  syncToServer(newItems)
}, { deep: true })
</script>
```

This only fires when `items` changes, not when any other state in the component changes. The debounce prevents hammering the server.

## Use computed for derived data

```js
// GOOD: computed caches and tracks automatically
export default {
  data() {
    return { numbers: [1, 2, 3, 4, 5] }
  },
  computed: {
    sum() {
      return this.numbers.reduce((a, b) => a + b, 0)
    }
  }
}
```

No extra render cycle. The value updates in the same render pass.

## Valid use cases for updated

The hook is appropriate for low-level DOM synchronization that depends on the rendered output, not on specific data:

### Syncing a third-party library with the DOM

```vue
<script setup>
import { onUpdated } from 'vue'

onUpdated(() => {
  thirdPartyWidget.refresh()
})
</script>
```

Some libraries (chart renderers, syntax highlighters) need to know when the DOM changed so they can re-measure or re-paint.

### Auto-scrolling after content changes

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const chatContainer = ref<HTMLElement | null>(null)

onUpdated(() => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})
</script>

<template>
  <div ref="chatContainer" class="chat">
    <div v-for="msg in messages" :key="msg.id">{{ msg.text }}</div>
  </div>
</template>
```

The scroll position depends on the rendered DOM height, not on the data directly. This is one of the few cases where `updated` makes sense.

### With a guard condition

If you must use `updated`, add a condition to avoid unnecessary work:

```js
export default {
  data() {
    return { content: '', lastSynced: '' }
  },
  updated() {
    if (this.content !== this.lastSynced) {
      this.syncContent()
      this.lastSynced = this.content
    }
  }
}
```

The guard prevents the operation from running when unrelated state changes caused the re-render.

## When to use what

| Need | Use |
|---|---|
| React to a specific data change | `watch` / `watchEffect` |
| Derive a value from reactive state | `computed` |
| Sync third-party library after DOM update | `onUpdated` |
| Scroll or measure DOM after render | `onUpdated` |
| API calls when data changes | `watch` with debounce |
| Update derived state | `computed` (never `updated`) |

See also: [How does Vue batch DOM updates?](/q/dom-update-batching) · [What is nextTick and when do you need it?](/q/nexttick)

## References

- [watch() — Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [computed() — Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Lifecycle Hooks — Vue guide](https://vuejs.org/guide/essentials/lifecycle.html)
