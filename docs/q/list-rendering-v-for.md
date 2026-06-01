---
order: 53
title: "How does list rendering work with v-for?"
difficulty: "beginner"
tags: ["directives"]
---

`v-for` iterates over arrays, objects, numbers, and strings to render a list of elements. It works like a `for...of` loop in JavaScript, but inside the template.

## Arrays

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
])
</script>
```

The second argument gives you the index:

```vue
<li v-for="(item, index) in items" :key="item.id">
  {{ index }}. {{ item.name }}
</li>
```

## Objects

```vue
<template>
  <div v-for="(value, key, index) in user" :key="key">
    {{ index }}. {{ key }}: {{ value }}
  </div>
</template>

<script setup>
const user = { name: 'Ana', role: 'Dev', level: 'Senior' }
</script>
```

## Ranges

```vue
<!-- Renders 1 through 5 -->
<span v-for="n in 5" :key="n">{{ n }}</span>
```

## Why :key matters

Without `:key`, Vue reuses DOM elements by position. This breaks when items are reordered, removed, or inserted in the middle, because component state and DOM state get out of sync.

```vue
<!-- Wrong: index as key has the same problem as no key on reorder -->
<li v-for="(item, index) in items" :key="index">...</li>

<!-- Right: unique, stable identifier -->
<li v-for="item in items" :key="item.id">...</li>
```

## v-for on template

When you need to render multiple elements per iteration without a wrapper:

```vue
<template>
  <ul>
    <template v-for="item in items" :key="item.id">
      <li>{{ item.name }}</li>
      <li class="divider" role="presentation"></li>
    </template>
  </ul>
</template>
```

## v-for with components

```vue
<template>
  <UserCard
    v-for="user in users"
    :key="user.id"
    :user="user"
    @remove="removeUser(user.id)"
  />
</template>
```

Props are not automatically injected from the iteration. You have to bind them explicitly.

## Mutating vs replacing arrays

Vue detects calls to mutation methods (`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`) on reactive arrays and updates the DOM. For non-mutating methods (`filter`, `map`, `concat`), assign the result back to the ref:

```ts
// Mutation: Vue detects this
items.value.push({ id: 4, name: 'Date' })

// Replacement: assign the new array
items.value = items.value.filter(i => i.name !== 'Banana')
```
