---
order: 124
title: "How would you virtualize a list of thousands of items?"
difficulty: "advanced"
tags: ["performance", "slots"]
summary: "Render only the items visible in the viewport using a library like vue-virtual-scroller. A 10,000-item list uses ~20 DOM nodes instead of 10,000."
---

List virtualization renders only the items visible in the viewport instead of creating DOM nodes for every item. A list of 10,000 items with virtualization still uses around 20 DOM nodes, the same as a list of 100.

## The problem

```vue
<template>
  <!-- 10,000 UserCard components mounted at once -->
  <div class="list">
    <UserCard v-for="user in users" :key="user.id" :user="user" />
  </div>
</template>
```

Each DOM node consumes memory, and mounting 10,000 components blocks the main thread. The browser struggles or crashes.

## Solution: vue-virtual-scroller

The most popular option. `RecycleScroller` recycles DOM nodes as the user scrolls.

```vue
<template>
  <RecycleScroller
    class="list"
    :items="users"
    :item-size="80"
    key-field="id"
    v-slot="{ item }"
  >
    <UserCard :user="item" />
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
</script>

<style scoped>
.list {
  height: 600px; /* container must have a fixed height */
}
</style>
```

For variable-height items, use `DynamicScroller`:

```vue
<template>
  <DynamicScroller :items="messages" :min-item-size="54" key-field="id">
    <template #default="{ item, index, active }">
      <DynamicScrollerItem :item="item" :active="active" :data-index="index">
        <ChatMessage :message="item" />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>
```

## Alternative: @tanstack/vue-virtual

A headless virtualizer that gives you full control over rendering. No built-in styles or container component.

```vue
<template>
  <div ref="parentRef" class="list-container">
    <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${row.size}px`,
          transform: `translateY(${row.start}px)`
        }"
      >
        <UserCard :user="users[row.index]" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

const users = ref([/* thousands of items */])
const parentRef = ref(null)

const virtualizer = useVirtualizer({
  count: users.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 80,
  overscan: 5
})
</script>

<style scoped>
.list-container {
  height: 600px;
  overflow: auto;
}
</style>
```

## Library comparison

| Library | Approach | Best for |
|---|---|---|
| `vue-virtual-scroller` | Component-based, batteries included | Quick setup, most use cases |
| `@tanstack/vue-virtual` | Headless composable | Custom layouts, full control |
| `vue-virtual-scroll-grid` | 2D virtualization | Grid/gallery layouts |

## When NOT to virtualize

- Lists under 50-100 items with simple content (overhead not worth it)
- Print layouts where all content must render
- SEO-critical content that needs to be in the initial HTML
- Accessibility scenarios where all items must be reachable by screen readers at once

See also: [How would you optimize performance in a Vue app?](/q/performance-optimization) · [How do props stability optimizations work?](/q/perf-props-stability) · [How would you diagnose a slow page?](/q/diagnose-slow-page)

## References

- [Performance](https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists) - Vue.js docs
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller) - GitHub
- [@tanstack/virtual](https://tanstack.com/virtual/latest) - TanStack docs
