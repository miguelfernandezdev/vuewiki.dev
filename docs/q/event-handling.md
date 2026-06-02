---
order: 12
title: "How does event handling work in Vue?"
difficulty: "beginner"
tags: ["directives", "components"]
---

Vue listens to DOM events with the [`v-on`](https://vuejs.org/api/built-in-directives.html#v-on) directive, shortened to `@`. You bind a handler directly in the template, and Vue takes care of attaching and removing the listener with the component's lifecycle.

```vue
<template>
  <button @click="count++">Clicked {{ count }} times</button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

## Inline vs method handlers

```vue
<template>
  <!-- Inline: expression evaluated directly -->
  <button @click="count++">+1</button>

  <!-- Method: reference to a function -->
  <button @click="increment">+1</button>

  <!-- Method with arguments -->
  <button @click="addAmount(5)">+5</button>

  <!-- Access the native event alongside custom args -->
  <button @click="log('clicked', $event)">Log</button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)

function increment() {
  count.value++
}

function addAmount(n: number) {
  count.value += n
}

function log(msg: string, event: MouseEvent) {
  console.log(msg, event.target)
}
</script>
```

## Event modifiers

Modifiers replace common imperative patterns like `event.preventDefault()` with declarative template syntax.

```vue
<template>
  <!-- Prevent default browser behavior -->
  <form @submit.prevent="onSubmit">...</form>

  <!-- Stop propagation to parent elements -->
  <button @click.stop="doThis">Click</button>

  <!-- Only trigger once -->
  <button @click.once="initialize">Init</button>

  <!-- Chain modifiers -->
  <a @click.stop.prevent="handleLink">Link</a>

  <!-- Only fire if the event target is the element itself, not a child -->
  <div @click.self="onDivClick">
    <button>Clicking here won't trigger onDivClick</button>
  </div>
</template>
```

## Key modifiers

```vue
<template>
  <!-- Specific keys -->
  <input @keyup.enter="submit" />
  <input @keyup.escape="cancel" />

  <!-- System modifier keys -->
  <input @keyup.ctrl.enter="submitAndClose" />
  <div @click.ctrl="selectMultiple">Hold Ctrl + click</div>

  <!-- .exact: only fire when EXACTLY these modifiers are pressed -->
  <button @click.ctrl.exact="onCtrlClick">Ctrl + Click only</button>
</template>
```

## Mouse button modifiers

```vue
<template>
  <div @click.left="onLeftClick">Left click</div>
  <div @click.right.prevent="onRightClick">Right click (no context menu)</div>
  <div @click.middle="onMiddleClick">Middle click</div>
</template>
```

## Quick reference

| Modifier | Replaces |
|---|---|
| `.prevent` | `event.preventDefault()` |
| `.stop` | `event.stopPropagation()` |
| `.once` | Remove listener after first trigger |
| `.self` | Only fire if `event.target === element` |
| `.passive` | `addEventListener({ passive: true })` for scroll performance |
| `.capture` | Use capture mode instead of bubbling |

See also: [What order should event modifiers go in?](/q/event-modifier-order) · [What is conditional rendering in Vue?](/q/conditional-rendering)

## References

- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
- [v-on](https://vuejs.org/api/built-in-directives.html#v-on) - Vue.js docs
