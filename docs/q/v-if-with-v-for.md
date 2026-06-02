---
order: 10
title: "Why can't you use v-if and v-for on the same element?"
difficulty: "beginner"
tags: ["directives", "errors"]
---

Because the precedence between them changed from Vue 2 to Vue 3, and putting them together creates ambiguous code regardless of version.

In **Vue 2**, `v-for` runs first. In **Vue 3**, `v-if` runs first. This means the same code behaves differently:

```vue
<!-- Vue 2: iterates all users, then filters by isActive (works but wasteful) -->
<!-- Vue 3: checks user.isActive BEFORE the loop, but user doesn't exist yet → error -->
<li v-for="user in users" v-if="user.isActive" :key="user.id">
  {{ user.name }}
</li>
```

## The right way to filter a list

Use a `computed` property:

```vue
<script setup lang="ts">
const activeUsers = computed(() =>
  props.users.filter(user => user.isActive)
)
</script>

<template>
  <li v-for="user in activeUsers" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

This is better in every way: cached, testable, reusable, and no ambiguity.

## The right way to hide an entire list

Wrap with `<template v-if>`:

```vue
<template v-if="shouldShowList">
  <li v-for="user in users" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

## Per-item condition inside the loop

Use `<template v-for>` with `v-if` on a child element:

```vue
<template v-for="user in users" :key="user.id">
  <li v-if="user.isActive">
    {{ user.name }}
  </li>
</template>
```

The ESLint rule `vue/no-use-v-if-with-v-for` catches this automatically.

See also: [What are event modifiers?](/q/event-modifier-order) · [Why doesn't v-show work on template elements?](/q/v-show-template-limitation) · [What is v-once and v-memo?](/q/v-once-v-memo)

## References

- [v-if with v-for](https://vuejs.org/guide/essentials/list.html#v-for-with-v-if) - Vue.js docs
- [Style Guide - Priority A](https://vuejs.org/style-guide/rules-essential.html#avoid-v-if-with-v-for) - Vue.js docs
- [List Rendering](https://vuejs.org/guide/essentials/list.html) - Vue.js docs
