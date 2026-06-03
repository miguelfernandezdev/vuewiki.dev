---
order: 12
title: 'How does event handling work in Vue?'
difficulty: 'beginner'
tags: ['directives', 'components']
summary: 'v-on (or @) binds DOM event listeners in the template. Vue attaches and removes them automatically with the component lifecycle.'
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

<PlaygroundLink code="<template>
  <button @click=&quot;count++&quot;>Clicked {{ count }} times</button>
</template>
&#10;<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>" />

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

<PlaygroundLink code="<template>
&#10;  <button @click=&quot;count++&quot;>+1</button>
&#10;  <button @click=&quot;increment&quot;>+1</button>
&#10;  <button @click=&quot;addAmount(5)&quot;>+5</button>
&#10;  <button @click=&quot;log('clicked', $event)&quot;>Log</button>
</template>
&#10;<script setup>
import { ref } from 'vue'
const count = ref(0)
&#10;function increment() {
  count.value++
}
&#10;function addAmount(n: number) {
  count.value += n
}
&#10;function log(msg: string, event: MouseEvent) {
  console.log(msg, event.target)
}
</script>" />

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

<PlaygroundLink code="<template>
&#10;  <form @submit.prevent=&quot;onSubmit&quot;>...</form>
&#10;  <button @click.stop=&quot;doThis&quot;>Click</button>
&#10;  <button @click.once=&quot;initialize&quot;>Init</button>
&#10;  <a @click.stop.prevent=&quot;handleLink&quot;>Link</a>
&#10;  <div @click.self=&quot;onDivClick&quot;>
    <button>Clicking here won't trigger onDivClick</button>
  </div>
</template>" />

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

<PlaygroundLink code="<template>
&#10;  <input @keyup.enter=&quot;submit&quot; />
  <input @keyup.escape=&quot;cancel&quot; />
&#10;  <input @keyup.ctrl.enter=&quot;submitAndClose&quot; />
  <div @click.ctrl=&quot;selectMultiple&quot;>Hold Ctrl + click</div>
&#10;  <button @click.ctrl.exact=&quot;onCtrlClick&quot;>Ctrl + Click only</button>
</template>" />

## Mouse button modifiers

```vue
<template>
  <div @click.left="onLeftClick">Left click</div>
  <div @click.right.prevent="onRightClick">Right click (no context menu)</div>
  <div @click.middle="onMiddleClick">Middle click</div>
</template>
```

<PlaygroundLink code="<template>
  <div @click.left=&quot;onLeftClick&quot;>Left click</div>
  <div @click.right.prevent=&quot;onRightClick&quot;>Right click (no context menu)</div>
  <div @click.middle=&quot;onMiddleClick&quot;>Middle click</div>
</template>" />

## Quick reference

| Modifier   | Replaces                                                     |
| ---------- | ------------------------------------------------------------ |
| `.prevent` | `event.preventDefault()`                                     |
| `.stop`    | `event.stopPropagation()`                                    |
| `.once`    | Remove listener after first trigger                          |
| `.self`    | Only fire if `event.target === element`                      |
| `.passive` | `addEventListener({ passive: true })` for scroll performance |
| `.capture` | Use capture mode instead of bubbling                         |

See also: [What order should event modifiers go in?](/q/event-modifier-order) · [What is conditional rendering in Vue?](/q/conditional-rendering)

## References

- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
- [v-on](https://vuejs.org/api/built-in-directives.html#v-on) - Vue.js docs
