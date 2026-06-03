---
order: 18
title: 'What are event modifiers and why does order matter?'
difficulty: 'intermediate'
tags: ['directives']
summary: 'Modifiers compile left to right. .prevent.self and .self.prevent produce different behavior. Order matters because each modifier transforms the handler chain.'
---

Event modifiers are suffixes on `v-on` (or `@`) that handle common event patterns declaratively. Vue compiles them into JavaScript in the exact order you write them, and that order changes behavior.

## Order matters

Vue generates code for each modifier left to right. `.prevent.self` and `.self.prevent` produce different results:

```ts
// @click.prevent.self compiles to:
event.preventDefault() // runs first, on ALL clicks
if (event.target !== event.currentTarget) return
handler()

// @click.self.prevent compiles to:
if (event.target !== event.currentTarget) return // check first
event.preventDefault() // only runs if the click was on the element itself
handler()
```

In practice:

```vue
<template>
  <!-- .prevent.self: prevents default on children too -->
  <div @click.prevent.self="handleClick">
    <a href="/page">Link</a>
    <!-- default prevented even though click is on child -->
  </div>

  <!-- .self.prevent: only prevents default on the div itself -->
  <div @click.self.prevent="handleClick">
    <a href="/page">Link</a>
    <!-- navigation works normally -->
  </div>
</template>
```

<PlaygroundLink code="<template>
&#10;  <div @click.prevent.self=&quot;handleClick&quot;>
    <a href=&quot;/page&quot;>Link</a>
&#10;  </div>
&#10;  <div @click.self.prevent=&quot;handleClick&quot;>
    <a href=&quot;/page&quot;>Link</a>
&#10;  </div>
</template>" />

## All event modifiers

| Modifier   | What it does                                                           |
| ---------- | ---------------------------------------------------------------------- |
| `.prevent` | Calls `event.preventDefault()`                                         |
| `.stop`    | Calls `event.stopPropagation()`                                        |
| `.self`    | Only fires if `event.target === event.currentTarget`                   |
| `.once`    | Removes the listener after the first trigger                           |
| `.capture` | Uses capture phase instead of bubbling                                 |
| `.passive` | Sets `{ passive: true }` on the listener (improves scroll performance) |

## Common combinations

```vue
<template>
  <!-- Stop propagation AND prevent default (order doesn't matter here) -->
  <a @click.stop.prevent="handleClick">Link</a>

  <!-- Fire only once, in capture phase -->
  <div @click.capture.once="handleOnce">...</div>

  <!-- Only fire if EXACTLY Ctrl is held (no Shift, no Alt) -->
  <button @click.ctrl.exact="onCtrlClick">Ctrl+Click</button>

  <!-- Prevent form submission, handle in JavaScript -->
  <form @submit.prevent="onSubmit">...</form>
</template>
```

<PlaygroundLink code="<template>
&#10;  <a @click.stop.prevent=&quot;handleClick&quot;>Link</a>
&#10;  <div @click.capture.once=&quot;handleOnce&quot;>...</div>
&#10;  <button @click.ctrl.exact=&quot;onCtrlClick&quot;>Ctrl+Click</button>
&#10;  <form @submit.prevent=&quot;onSubmit&quot;>...</form>
</template>" />

## When order doesn't matter

For most combinations, order is irrelevant. `.stop.prevent` and `.prevent.stop` both call `stopPropagation()` and `preventDefault()` unconditionally.

Order only matters when one modifier is conditional (`.self`) and the other has side effects (`.prevent`, `.stop`). In those cases, think about whether the side effect should run before or after the condition check.

## When to use separate handlers instead

If the modifier chain gets confusing, split the logic into explicit handlers:

```vue
<template>
  <div @click.self="handleSelfClick">
    <button @click.prevent="handleChildClick">Child</button>
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div @click.self=&quot;handleSelfClick&quot;>
    <button @click.prevent=&quot;handleChildClick&quot;>Child</button>
  </div>
</template>" />

Clarity beats cleverness.

See also: [How do you inject raw HTML in Vue?](/q/v-html-xss) · [Why can't you use v-if and v-for on the same element?](/q/v-if-with-v-for) · [Why doesn't v-show work on template elements?](/q/v-show-template-limitation)

## References

- [Event Modifiers](https://vuejs.org/guide/essentials/event-handling.html#event-modifiers) - Vue.js docs
- [Key Modifiers](https://vuejs.org/guide/essentials/event-handling.html#key-modifiers) - Vue.js docs
- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
