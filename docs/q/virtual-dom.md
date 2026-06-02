---
order: 2
title: "What is the Virtual DOM and how does Vue use it?"
difficulty: "beginner"
tags: ["core", "reactivity"]
---

The [Virtual DOM](https://vuejs.org/guide/extras/rendering-mechanism.html#virtual-dom) is a lightweight JavaScript representation of the real DOM. Instead of manipulating the browser's DOM directly on every change, Vue builds a tree of plain objects (vnodes), diffs the new tree against the previous one, and applies only the minimal set of real DOM operations needed.

## How it works

1. Your template compiles into a **render function** that returns vnodes.
2. When reactive state changes, Vue re-runs the render function to produce a **new vnode tree**.
3. Vue **diffs** (or "patches") the new tree against the old one.
4. Only the differences are applied to the real DOM.

```
State changes → new vnode tree → diff with old tree → patch real DOM
```

```ts
// What a vnode looks like internally (simplified)
const vnode = {
  type: 'div',
  props: { class: 'card' },
  children: [
    { type: 'h2', children: 'Title' },
    { type: 'p', children: 'Content' }
  ]
}
```

## Why not update the DOM directly?

Real DOM operations are expensive. Reading `element.offsetHeight` triggers layout recalculation. Inserting a node can cause reflows across the page. By batching changes through a virtual layer, Vue minimizes how often it touches the real DOM.

```vue
<script setup>
import { ref } from 'vue'

const items = ref(['a', 'b', 'c'])

function addItem() {
  items.value.push('d')
  items.value.push('e')
  // Vue batches both changes into a single DOM update
}
</script>
```

## Vue's optimizations over a naive diff

Vue's [compiler](https://vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom) analyzes your templates at build time and adds hints that make the runtime diff faster:

- **Static hoisting.** Elements that never change are created once and reused across re-renders.
- **Patch flags.** Dynamic bindings are tagged so the diff skips static parts entirely.
- **Tree flattening.** Only nodes with dynamic content are included in the diff traversal.

```vue
<template>
  <div>
    <h1>Static title</h1>           <!-- hoisted, skipped during diff -->
    <p>{{ dynamicContent }}</p>      <!-- patch flag: TEXT -->
    <span :class="activeClass">ok</span> <!-- patch flag: CLASS -->
  </div>
</template>
```

## Virtual DOM vs no Virtual DOM

Some frameworks (Svelte, SolidJS) skip the Virtual DOM entirely and compile templates to direct DOM instructions. Vue chose the Virtual DOM because it enables the render function API, JSX support, and programmatic vnode manipulation while still being fast enough for virtually all use cases.

| Approach | Frameworks | Tradeoff |
|---|---|---|
| Virtual DOM | Vue, React | Flexible API, slight overhead from diffing |
| No Virtual DOM | Svelte, SolidJS | Less overhead, but limited programmatic control |

See also: [What is the difference between a component and an element?](/q/component-vs-element-vnode), [What is Vue and what are its main features?](/q/what-is-vue)

## References

- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
