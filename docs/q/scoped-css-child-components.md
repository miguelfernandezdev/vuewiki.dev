---
order: 30
title: "Why doesn't scoped CSS style child component elements?"
difficulty: "intermediate"
tags: ["components", "errors", "teleport"]
summary: "Scoped CSS adds data-v-xxxxx attributes to elements. Child components don't get that attribute, so selectors don't match. Use :deep() to target children."
---

Because Vue scoped CSS works by adding a unique `data-v-xxxxx` attribute to elements in the current component's template and appending it to every CSS selector. Elements rendered by child components don't get that attribute, so the selectors don't match.

```vue
<template>
  <div class="wrapper">
    <DatePicker />
  </div>
</template>

<style scoped>
/* This won't work — .calendar-popup is inside DatePicker's template */
.wrapper .calendar-popup {
  background: white;
}
</style>
```

Generated CSS looks like `.wrapper[data-v-abc123] .calendar-popup[data-v-abc123]`, but `.calendar-popup` doesn't have `data-v-abc123`.

## How to fix it

Use the `:deep()` selector to pierce into child components:

```vue
<style scoped>
.wrapper :deep(.calendar-popup) {
  background: white;
}

.wrapper :deep(.date-input) {
  border-color: blue;
}
</style>
```

Always scope `:deep()` to a parent class to limit its reach:

```vue
<style scoped>
/* Too broad — affects ALL .btn in any child */
:deep(.btn) { background: blue; }

/* Better — only .btn inside .wrapper */
.wrapper :deep(.btn) { background: blue; }
</style>
```

## Exception: the child's root element

A child component's **root element** IS affected by parent scoped CSS. Vue does this intentionally so parents can control layout (margins, positioning) of their children:

```vue
<style scoped>
/* This works without :deep() — targets child's root element */
.date-picker {
  margin-bottom: 1rem;
}
</style>
```

## Old syntax (don't use)

```css
.parent >>> .child { }     /* doesn't work with SCSS */
.parent /deep/ .child { }  /* deprecated */
.parent ::v-deep .child { } /* old Vue 3 syntax */
```

In Vue 3, `:deep()` is the only supported syntax.

See also: [How do scoped styles, CSS Modules, and dynamic classes work?](/q/css-scoped-modules-dynamic) · [How do scoped styles interact with Teleport?](/q/teleport-scoped-styles)

## References

- [Scoped CSS](https://vuejs.org/api/sfc-css-features.html#scoped-css) - Vue.js docs
- [Deep Selectors](https://vuejs.org/api/sfc-css-features.html#deep-selectors) - Vue.js docs
