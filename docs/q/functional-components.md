---
order: 167
title: "What are functional components and when are they useful?"
difficulty: "intermediate"
tags: ["components", "performance"]
---

Functional components are components defined as plain functions that receive props and return VNodes. They have no instance, no reactive state, no lifecycle hooks, and no `this` context. In Vue 2, they offered a measurable performance advantage because they skipped the component instance creation overhead. In Vue 3, stateful components are already so fast that the performance difference is negligible. Functional components still exist but their main use is now programmatic rendering patterns, not optimization.

## Syntax in Vue 3

```ts
import { h } from 'vue'
import type { FunctionalComponent } from 'vue'

interface BadgeProps {
  label: string
  color?: 'green' | 'red' | 'blue'
}

const Badge: FunctionalComponent<BadgeProps> = (props, { slots }) => {
  return h('span', {
    class: `badge badge-${props.color ?? 'blue'}`
  }, props.label)
}

Badge.props = {
  label: { type: String, required: true },
  color: { type: String, default: 'blue' }
}
```

The function receives `props` as the first argument and a context object with `slots`, `emit`, and `attrs` as the second.

## Using with JSX/TSX

Functional components feel more natural with JSX:

```tsx
const Badge: FunctionalComponent<BadgeProps> = (props) => (
  <span class={`badge badge-${props.color ?? 'blue'}`}>
    {props.label}
  </span>
)
```

## What they can't do

| Feature | SFC component | Functional component |
|---|---|---|
| Reactive state (`ref`, `reactive`) | Yes | No |
| Lifecycle hooks | Yes | No |
| `watch` / `computed` | Yes | No |
| Template syntax | Yes | No (render function only) |
| `<style scoped>` | Yes | No |
| Component instance (`this`) | Yes | No |
| Slots | Yes | Yes |
| Props validation | Yes | Yes |
| Emit events | Yes | Yes |

## When they're actually useful

### 1. Thin wrapper components

Components that just pass through or reshape props for another component:

```ts
const PrimaryButton: FunctionalComponent<ButtonProps> = (props, { slots }) => {
  return h(BaseButton, { ...props, variant: 'primary' }, slots)
}
```

### 2. Render-based logic (conditional rendering helpers)

```ts
const Show: FunctionalComponent<{ when: boolean }> = (props, { slots }) => {
  return props.when ? slots.default?.() : null
}
```

### 3. Higher-order patterns in libraries

Libraries that generate components programmatically benefit from the lightweight function signature over full SFC setup.

## Vue 2 vs Vue 3 functional components

In Vue 2, functional components were marked with `functional: true` in SFCs or in component options, and they had a significant performance benefit because Vue 2's component instance creation was expensive.

Vue 3 optimized stateful components so heavily (faster instance creation, compiler optimizations, Proxy-based reactivity) that the overhead difference is minimal. The Vue team recommends using standard `<script setup>` SFCs for everything unless you have a specific reason to use a render function.

## Should you use them?

For application code, almost never. A standard SFC with `<script setup>` is more readable, supports scoped styles, has better tooling support, and the performance difference doesn't justify the tradeoff. Use functional components when you're building a library that needs programmatic component generation, or when a component truly has no state and a render function is clearer than a template.

See also: [How do render functions and JSX work?](/q/render-functions-jsx) · [What are slots?](/q/slots)

## References

- [Render Functions](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
- [Functional Components](https://vuejs.org/guide/extras/render-function.html#functional-components) - Vue.js docs
