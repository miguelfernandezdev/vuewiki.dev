---
order: 127
title: "Why should you avoid component abstraction in large lists?"
difficulty: "advanced"
tags: ["performance", "components"]
---

Every Vue component instance has a cost: reactive setup, vnode creation, lifecycle hooks, and memory for the instance proxy. For a single component this is negligible. In a list of 100+ items, the cost multiplies. If each list item is 5 nested components deep, that's 500 instances instead of 100.

## The problem

```vue
<!-- UserCard.vue — deeply nested -->
<template>
  <Card>
    <CardHeader>
      <UserAvatar :src="user.avatar" />
    </CardHeader>
    <CardBody>
      <Text>{{ user.name }}</Text>
    </CardBody>
  </Card>
</template>
```

```vue
<!-- 100 users = 500+ component instances -->
<UserCard v-for="user in users" :key="user.id" :user="user" />
```

Each `Card`, `CardHeader`, `CardBody`, `UserAvatar`, and `Text` is a separate component instance. Multiply by 100 list items and you get significant memory and render overhead.

## The fix: flatten list items

Replace wrapper components with plain HTML elements in hot-path list items:

```vue
<!-- UserCard.vue — flattened -->
<script setup lang="ts">
defineProps<{ user: { id: string; name: string; avatar: string } }>()
</script>

<template>
  <div class="card">
    <div class="card-header">
      <img :src="user.avatar" :alt="user.name" class="avatar" />
    </div>
    <div class="card-body">
      <span>{{ user.name }}</span>
    </div>
  </div>
</template>
```

100 users now create 100 component instances instead of 500. The visual result is identical.

## Impact by numbers

| List size | Components per item | Total instances |
|---|---|---|
| 100 | 1 (flat) | 100 |
| 100 | 5 (nested) | 500 |
| 1,000 | 1 (flat) | 1,000 |
| 1,000 | 5 (nested) | 5,000 |

Each instance adds roughly 1-2 KB of memory overhead. At 5,000 instances, that's 5-10 MB just for component scaffolding.

## When abstraction is fine

Not every list needs flattening. Keep component abstractions when:

**The list is small** (under 20-30 items). The overhead is not noticeable.

**The list is virtualized.** If you use `vue-virtual-scroller` or `@tanstack/vue-virtual`, only 10-20 items are rendered at any time. Deep nesting in each item is acceptable because the total instance count stays low.

```vue
<RecycleScroller :items="items" :item-size="80">
  <template #default="{ item }">
    <!-- OK — only ~20 instances exist regardless of list length -->
    <ComplexItemCard :item="item" />
  </template>
</RecycleScroller>
```

**The component has real logic** (tooltips, state, event handling), not just styling. Extracting a `UserStatusBadge` that has conditional rendering logic and a tooltip is worth the overhead.

## What to flatten

Replace with plain elements:

| Instead of | Use |
|---|---|
| `<Card>` wrapper | `<div class="card">` |
| `<Text>` for typography | `<span class="text-body">` |
| `<Flex>` / `<Stack>` layout components | `<div class="flex gap-2">` |
| `<Avatar>` that just wraps an img | `<img class="avatar">` |

Keep as components:

| Component | Why |
|---|---|
| `<UserStatusBadge>` | Has conditional logic, tooltip |
| `<EditableField>` | Manages its own editing state |
| `<LazyImage>` | Handles intersection observer, loading state |

## How to measure

Open Vue DevTools, look at the Components tab. Count how many instances exist when your list renders. If you see thousands, investigate whether flattening list items reduces that number meaningfully.

The Performance tab in DevTools also shows render time per component. Sort by total time to find the most expensive components in your list.
