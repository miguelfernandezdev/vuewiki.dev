---
order: 61
title: "How do you create custom directives in Vue?"
difficulty: "intermediate"
tags: ["directives", "v-model"]
---

[Custom directives](https://vuejs.org/guide/reusability/custom-directives.html) give you low-level access to DOM elements when built-in directives (`v-if`, `v-show`, `v-model`) aren't enough. They're ideal for things like auto-focus, intersection observers, or third-party library integration.

## Basic syntax

A directive is an object with lifecycle hooks that receive the element and a binding object.

```vue
<script setup>
const vFocus = {
  mounted(el: HTMLElement) {
    el.focus()
  }
}
</script>

<template>
  <input v-focus />
</template>
```

In `<script setup>`, any variable starting with `v` followed by an uppercase letter is automatically available as a directive in the template.

## Function shorthand

If you only need logic on `mounted` and `updated` (the most common case), use a plain function:

```vue
<script setup>
const vFocus = (el: HTMLElement) => el.focus()
</script>

<template>
  <input v-focus />
</template>
```

## Directive hooks

```ts
const vExample = {
  created(el, binding) {},      // before element's attrs/events are applied
  beforeMount(el, binding) {},  // before inserted into DOM
  mounted(el, binding) {},      // element inserted into DOM
  beforeUpdate(el, binding) {}, // before parent component updates
  updated(el, binding) {},      // after parent component updated
  beforeUnmount(el, binding) {},
  unmounted(el, binding) {}     // element removed from DOM
}
```

The `binding` object contains:

| Property | Description |
|---|---|
| `value` | The current value passed to the directive |
| `oldValue` | The previous value (only in `updated`) |
| `arg` | The argument after the colon (`v-dir:arg`) |
| `modifiers` | An object of modifiers (`v-dir.mod` gives `{ mod: true }`) |

## Using arguments, modifiers, and values

```vue
<script setup>
const vHighlight = {
  mounted(el: HTMLElement, binding) {
    const color = binding.value || 'yellow'
    const isBold = binding.modifiers.bold

    el.style.backgroundColor = color
    if (isBold) el.style.fontWeight = 'bold'
  },
  updated(el: HTMLElement, binding) {
    el.style.backgroundColor = binding.value || 'yellow'
  }
}
</script>

<template>
  <p v-highlight="'lightblue'">Highlighted</p>
  <p v-highlight.bold="'pink'">Bold and highlighted</p>
</template>
```

## Cleanup in unmounted

Any side effects (listeners, observers, timers) must be cleaned up to avoid memory leaks.

```ts
const vResize = {
  mounted(el: HTMLElement) {
    const observer = new ResizeObserver((entries) => {
      console.log(entries[0].contentRect)
    })
    observer.observe(el)
    el._resizeObserver = observer
  },
  unmounted(el: HTMLElement) {
    el._resizeObserver?.disconnect()
  }
}
```

## Global registration

For directives used across the app, register them on the application instance:

```ts
// main.ts
const app = createApp(App)

app.directive('focus', {
  mounted(el) { el.focus() }
})
```

## When to use directives vs composables vs components

| Need | Use |
|---|---|
| Direct DOM manipulation (focus, scroll, attributes) | Directive |
| Reusable stateful logic (fetch, debounce, timers) | Composable |
| Reusable UI with template/structure | Component |

Directives should stay simple. If you find yourself managing complex state or emitting events inside a directive, you probably want a composable or a component instead.

See also: [What is a composable?](/q/what-is-a-composable)

## References

- [Custom Directives](https://vuejs.org/guide/reusability/custom-directives.html) - Vue.js docs
