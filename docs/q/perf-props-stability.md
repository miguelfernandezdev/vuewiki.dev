---
order: 126
title: 'How do props stability optimizations work?'
difficulty: 'advanced'
tags: ['performance', 'components']
summary: "Vue skips re-rendering children when props haven't changed. Avoid passing shared values (like activeId) to every list item; pass only a boolean flag."
---

Vue skips re-rendering a child component when none of its props changed. Props stability means structuring your props so that only the components that truly need to update receive changed values. The biggest win is in lists: passing a shared value like `activeId` to every item forces all items to re-render, even though only two items actually changed state.

## The problem

```vue
<!-- Parent -->
<script setup>
const items = ref([
  /* 100 items */
])
const activeId = (ref < number) | (null > null)
</script>

<template>
  <ListItem
    v-for="item in items"
    :key="item.id"
    :id="item.id"
    :active-id="activeId"
  />
</template>
```

<PlaygroundLink code="<!-- Parent -->
<script setup>
const items = ref([
  /* 100 items */
])
const activeId = (ref < number) | (null > null)
</script>
&#10;<template>
  <ListItem
    v-for=&quot;item in items&quot;
    :key=&quot;item.id&quot;
    :id=&quot;item.id&quot;
    :active-id=&quot;activeId&quot;
  />
</template>" />

</template>" />

```vue
<!-- ListItem.vue -->
<script setup>
const props = defineProps<{ id: number; activeId: number | null }>()
</script>

<template>
  <div :class="{ active: id === activeId }">{{ id }}</div>
</template>
```

<PlaygroundLink code="<!-- ListItem.vue -->
<script setup>
const props = defineProps<{ id: number; activeId: number | null }>()
</script>
&#10;<template>
  <div :class=&quot;{ active: id === activeId }&quot;>{{ id }}</div>
</template>" />

When `activeId` changes from 1 to 2, the `activeId` prop changes for ALL 100 items. Vue re-renders every single `ListItem`, even though only two items actually need a visual update (the previously active one and the newly active one).

## The fix: pre-compute in the parent

```vue
<!-- Parent -->
<template>
  <ListItem
    v-for="item in items"
    :key="item.id"
    :id="item.id"
    :active="item.id === activeId"
  />
</template>
```

<PlaygroundLink code="<!-- Parent -->
<template>
  <ListItem
    v-for=&quot;item in items&quot;
    :key=&quot;item.id&quot;
    :id=&quot;item.id&quot;
    :active=&quot;item.id === activeId&quot;
  />
</template>" />

</template>" />

```vue
<!-- ListItem.vue -->
<script setup>
defineProps<{ id: number; active: boolean }>()
</script>

<template>
  <div :class="{ active }">{{ id }}</div>
</template>
```

<PlaygroundLink code="<!-- ListItem.vue -->
<script setup>
defineProps<{ id: number; active: boolean }>()
</script>
&#10;<template>
  <div :class=&quot;{ active }&quot;>{{ id }}</div>
</template>" />

Now when `activeId` changes from 1 to 2:

- Item 1: `:active` goes from `true` to `false` (re-renders)
- Item 2: `:active` goes from `false` to `true` (re-renders)
- Items 3-100: `:active` stays `false` (skipped)

2 re-renders instead of 100.

## Common unstable prop patterns

**Passing the whole selection set:**

```vue
<!-- BAD: all items re-render when any selection changes -->
<Item v-for="item in items" :key="item.id" :selected-ids="selectedIds" />

<!-- GOOD: only affected items re-render -->
<Item
  v-for="item in items"
  :key="item.id"
  :selected="selectedIds.has(item.id)"
/>
```

<PlaygroundLink code="<!-- BAD: all items re-render when any selection changes -->
<Item v-for=&quot;item in items&quot; :key=&quot;item.id&quot; :selected-ids=&quot;selectedIds&quot; />
&#10;<!-- GOOD: only affected items re-render -->
<Item
  v-for=&quot;item in items&quot;
  :key=&quot;item.id&quot;
  :selected=&quot;selectedIds.has(item.id)&quot;
/>" />

&#10;<!-- GOOD: only affected items re-render -->
<Item
  v-for=&quot;item in items&quot;
  :key=&quot;item.id&quot;
  :selected=&quot;selectedIds.has(item.id)&quot;
/>" />

**Passing the list length or index:**

```vue
<!-- BAD: total changes whenever the list changes -->
<Item
  v-for="(item, index) in items"
  :key="item.id"
  :index="index"
  :total="items.length"
/>

<!-- GOOD: pass only what the child actually needs -->
<Item
  v-for="item in items"
  :key="item.id"
  :is-last="item === items[items.length - 1]"
/>
```

<PlaygroundLink code="<!-- BAD: total changes whenever the list changes -->
<Item
  v-for=&quot;(item, index) in items&quot;
  :key=&quot;item.id&quot;
  :index=&quot;index&quot;
  :total=&quot;items.length&quot;
/>
&#10;<!-- GOOD: pass only what the child actually needs -->
<Item
  v-for=&quot;item in items&quot;
  :key=&quot;item.id&quot;
  :is-last=&quot;item === items[items.length - 1]&quot;
/>" />

&#10;<!-- GOOD: pass only what the child actually needs -->
<Item
  v-for=&quot;item in items&quot;
  :key=&quot;item.id&quot;
  :is-last=&quot;item === items[items.length - 1]&quot;
/>" />

**Passing an inline object or function:**

```vue
<!-- BAD: new object on every render → always different reference -->
<Item
  v-for="item in items"
  :key="item.id"
  :style="{ color: item.color }"
  :on-click="() => select(item.id)"
/>
```

<PlaygroundLink code="<!-- BAD: new object on every render → always different reference -->
<Item
  v-for=&quot;item in items&quot;
  :key=&quot;item.id&quot;
  :style=&quot;{ color: item.color }&quot;
  :on-click=&quot;() => select(item.id)&quot;
/>" />

Inline objects and arrow functions create a new reference every render. Vue sees a "new" prop and re-renders the child. Move them to computed or methods if performance matters.

## Impact at scale

| List size    | Unstable prop (activeId) | Stable prop (:active boolean) |
| ------------ | ------------------------ | ----------------------------- |
| 100 items    | 100 re-renders           | 2 re-renders                  |
| 1,000 items  | 1,000 re-renders         | 2 re-renders                  |
| 10,000 items | 10,000 re-renders        | 2 re-renders                  |

The optimization has a constant cost (always 2) regardless of list size. The naive approach has linear cost.

## The rule

If a prop value changes for ALL children but only SOME children need to react, pre-compute the derived value in the parent and pass the result. The child should receive only values that are specific to its own state.

See also: [How does reducing component abstraction improve list performance?](/q/perf-component-abstraction-lists) · [What is the Virtual DOM and how does Vue use it?](/q/virtual-dom) · [How do you declare props with TypeScript?](/q/props-with-typescript)

## References

- [Props Stability](https://vuejs.org/guide/best-practices/performance.html#props-stability) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
