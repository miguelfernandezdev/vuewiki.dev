---
order: 8
title: "What's the difference between v-if and v-show?"
difficulty: "beginner"
tags: ["directives"]
---

Both hide and show elements based on a condition, but they do it in completely different ways — and that difference has real performance implications.

## v-if: adds and removes from the DOM

[`v-if`](https://vuejs.org/guide/essentials/conditional.html#v-if) completely removes the element (and its children, components, event listeners) from the DOM when the condition is `false`. When it becomes `true`, Vue creates everything from scratch — runs `setup`, mounts the component, triggers `onMounted`.

```vue
<template>
  <div v-if="showPanel">
    <!-- This entire component is destroyed when showPanel is false -->
    <ExpensiveChart :data="chartData" />
  </div>
</template>
```

This means toggling `v-if` is expensive: Vue has to tear down and rebuild the DOM subtree every time. But if the condition is `false` on initial render, nothing is created at all — zero cost.

## v-show: hides with CSS

[`v-show`](https://vuejs.org/guide/essentials/conditional.html#v-show) always renders the element and keeps it in the DOM. It just toggles `display: none` on it. The component stays mounted, its state is preserved, and no lifecycle hooks fire on toggle.

```vue
<template>
  <div v-show="showPanel">
    <!-- Always in the DOM, just hidden via CSS when showPanel is false -->
    <ExpensiveChart :data="chartData" />
  </div>
</template>
```

Toggling is cheap (one CSS property change), but the initial render always pays the full cost even if the element starts hidden.

## When to use which

| Scenario | Use | Why |
|---|---|---|
| User toggles something frequently (tabs, dropdowns, tooltips) | `v-show` | Avoid repeated mount/unmount |
| Condition rarely changes (feature flags, permissions) | `v-if` | Don't pay render cost for something the user may never see |
| Large component tree that's expensive to mount | `v-show` if toggled often, `v-if` if rarely shown | Balance initial cost vs toggle cost |
| Need `v-else` or `v-else-if` chains | `v-if` | `v-show` doesn't support else chains |
| Need to wrap multiple elements with `<template>` | `v-if` | `v-show` doesn't work on `<template>` |

**Default to `v-if`** unless you have a specific reason to keep the element in the DOM. Most conditions in real apps don't toggle frequently enough for `v-show` to matter.

See also: [What is conditional rendering in Vue?](/q/conditional-rendering) · [Why shouldn't you use v-if with v-for?](/q/v-if-with-v-for)

## References

- [Conditional Rendering](https://vuejs.org/guide/essentials/conditional.html) - Vue.js docs
- [v-if](https://vuejs.org/api/built-in-directives.html#v-if) - Vue.js docs
- [v-show](https://vuejs.org/api/built-in-directives.html#v-show) - Vue.js docs
