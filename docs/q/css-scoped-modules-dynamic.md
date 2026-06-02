---
order: 52
title: "How do scoped styles, CSS Modules, and dynamic classes work in Vue?"
difficulty: "beginner"
tags: ["components", "styling", "teleport"]
---

Vue Single-File Components offer three ways to style components, each solving a different problem.

## Scoped styles

Adding `scoped` to a `<style>` block limits the CSS to the current component. Vue adds a unique `data-v-xxxxx` attribute to every element in the template and appends it to each selector.

```vue
<style scoped>
.title { color: blue; }
/* Compiles to: .title[data-v-abc123] { color: blue; } */
</style>
```

Styles won't leak to parent or sibling components. Child component internals are also unaffected (except the child's root element).

## CSS Modules

CSS Modules hash class names at build time. You bind them via `$style` instead of writing plain class names.

```vue
<template>
  <h1 :class="$style.title">Hello</h1>
</template>

<style module>
.title { color: blue; }
/* Compiles to: .title_abc1 { color: blue; } */
</style>
```

The advantage over scoped styles: hashed names work everywhere in the DOM, so they're safe for teleported content, dynamic elements, and third-party integrations.

## Dynamic classes

Vue offers several syntaxes for binding classes dynamically.

```vue
<template>
  <!-- Object syntax: key is class name, value is condition -->
  <div :class="{ active: isActive, disabled: isDisabled }">...</div>

  <!-- Array syntax: combine multiple sources -->
  <div :class="[baseClass, { active: isActive }]">...</div>

  <!-- With CSS Modules -->
  <div :class="[$style.card, { [$style.active]: isActive }]">...</div>
</template>

<script setup>
import { ref } from 'vue'

const isActive = ref(true)
const isDisabled = ref(false)
const baseClass = ref('card')
</script>
```

## Dynamic inline styles

```vue
<template>
  <!-- Object syntax -->
  <div :style="{ color: textColor, fontSize: size + 'px' }">...</div>

  <!-- Array syntax: merges multiple style objects -->
  <div :style="[baseStyles, overrideStyles]">...</div>
</template>
```

Vue auto-prefixes vendor-specific CSS properties at runtime, so you don't need to write `-webkit-` or `-moz-` yourself.

## When to use what

| Need | Use |
|---|---|
| Simple component isolation | `<style scoped>` |
| Teleported or dynamic content | `<style module>` |
| Toggle a class based on state | `:class="{ active: isActive }"` |
| Combine static and dynamic classes | `:class="['base', { active: isActive }]"` |
| One-off inline overrides | `:style="{ color: x }"` |

See also: [Why doesn't scoped CSS style child component elements?](/q/scoped-css-child-components) · [How do scoped styles interact with Teleport?](/q/teleport-scoped-styles)

## References

- [Scoped CSS](https://vuejs.org/api/sfc-css-features.html#scoped-css) - Vue.js docs
- [CSS Modules](https://vuejs.org/api/sfc-css-features.html#css-modules) - Vue.js docs
- [v-bind() in CSS](https://vuejs.org/api/sfc-css-features.html#v-bind-in-css) - Vue.js docs
