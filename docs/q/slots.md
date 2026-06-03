---
order: 25
title: "What are slots and what are they used for?"
difficulty: "intermediate"
tags: ["components", "slots"]
summary: "Slots let a parent pass template content into a child. Default slots for content, named slots for multiple areas, scoped slots for data from the child."
---

[Slots](https://vuejs.org/guide/components/slots.html) let a parent component pass template content into a child. Instead of the child deciding what to render, the parent provides the markup and the child decides where to place it. This makes components flexible: a `Card` doesn't need a prop for every possible layout variation; it provides a slot and the parent fills it in.

## Default slot

The simplest form. The child defines a `<slot />` placeholder, and anything the parent puts between the component tags replaces it:

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- Usage -->
<Card>
  <p>This paragraph replaces the slot</p>
</Card>
```

If the parent provides nothing, you can set fallback content: `<slot>Default text</slot>`.

## Named slots

When a component has multiple insertion points, give each slot a name. The parent targets them with `<template #name>`:

```vue
<!-- PageLayout.vue -->
<template>
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer" /></footer>
</template>

<!-- Usage -->
<PageLayout>
  <template #header>
    <h1>Dashboard</h1>
  </template>

  <p>Main content goes into the default slot</p>

  <template #footer>
    <span>© 2025</span>
  </template>
</PageLayout>
```

`#header` is shorthand for `v-slot:header`. Content not wrapped in a `<template #name>` goes into the default slot.

## Scoped slots

Sometimes the child has data the parent needs to render. Scoped slots pass data from the child back to the parent through slot props:

```vue
<!-- ItemList.vue -->
<script setup lang="ts">
defineProps<{ items: string[] }>()
</script>

<template>
  <ul>
    <li v-for="(item, index) in items" :key="index">
      <slot name="item" :value="item" :index="index" />
    </li>
  </ul>
</template>

<!-- Usage: parent decides how each item looks -->
<ItemList :items="['Apple', 'Banana', 'Cherry']">
  <template #item="{ value, index }">
    <strong>{{ index + 1 }}.</strong> {{ value }}
  </template>
</ItemList>
```

The child owns the data and the loop. The parent owns the rendering. This is the **render delegation pattern**, the same idea behind headless UI libraries like [Headless UI](https://headlessui.com/) and [Radix Vue](https://www.radix-vue.com/).

## When to use slots vs props

Use **props** when the parent passes data and the child decides how to display it. Use **slots** when the parent decides what to display and the child decides where to place it.

| Scenario | Use |
| --- | --- |
| Pass a title string | Prop |
| Pass arbitrary header markup | Named slot |
| Child has data, parent decides rendering | Scoped slot |
| Component wraps content (card, modal, layout) | Default slot |

See also: [How do render functions and JSX work in Vue?](/q/render-functions-jsx) · [What are fallthrough attributes?](/q/fallthrough-attrs) · [What is defineExpose and when is it needed?](/q/define-expose)

## References

- [Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
- [Scoped Slots](https://vuejs.org/guide/components/slots.html#scoped-slots) - Vue.js docs
- [Renderless Components](https://vuejs.org/guide/components/slots.html#renderless-components) - Vue.js docs
