---
order: 109
title: 'How do you type event handlers in Vue templates?'
difficulty: 'intermediate'
tags: ['typescript', 'components']
summary: 'Type the event parameter explicitly (e: Event) and cast event.target to the correct element type (e.target as HTMLInputElement) to access .value or .checked.'
---

DOM event handlers in Vue templates receive an `Event` object, but TypeScript doesn't know which specific element triggered it. You need to type the event parameter explicitly and cast `event.target` to the correct element type to access properties like `.value` or `.checked`.

## The problem

```ts
// error in strict mode: implicit 'any'
function handleInput(event) {
  console.log(event.target.value)
}

// error: 'value' does not exist on EventTarget
function handleInput(event: Event) {
  console.log(event.target.value)
}
```

`event.target` is typed as `EventTarget | null`, which has no `.value` property. You need a type assertion.

## The solution

```vue
<script setup lang="ts">
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  console.log(target.value)
}

function handleClick(event: MouseEvent) {
  console.log(event.clientX, event.clientY)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    submit()
  }
}

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()
  const form = event.target as HTMLFormElement
  const data = new FormData(form)
}
</script>

<template>
  <input @input="handleInput" />
  <button @click="handleClick">Click</button>
  <input @keydown="handleKeydown" />
  <form @submit="handleSubmit">...</form>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  console.log(target.value)
}
&#10;function handleClick(event: MouseEvent) {
  console.log(event.clientX, event.clientY)
}
&#10;function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    submit()
  }
}
&#10;function handleSubmit(event: SubmitEvent) {
  event.preventDefault()
  const form = event.target as HTMLFormElement
  const data = new FormData(form)
}
</script>
&#10;<template>
  <input @input=&quot;handleInput&quot; />
  <button @click=&quot;handleClick&quot;>Click</button>
  <input @keydown=&quot;handleKeydown&quot; />
  <form @submit=&quot;handleSubmit&quot;>...</form>
</template>" />

## Event type reference

| Template event             | TypeScript type | Key properties                    |
| -------------------------- | --------------- | --------------------------------- |
| `@click`, `@dblclick`      | `MouseEvent`    | clientX, clientY, button, ctrlKey |
| `@keydown`, `@keyup`       | `KeyboardEvent` | key, code, ctrlKey, shiftKey      |
| `@input`, `@change`        | `Event`         | target (needs cast)               |
| `@focus`, `@blur`          | `FocusEvent`    | relatedTarget                     |
| `@submit`                  | `SubmitEvent`   | submitter                         |
| `@drag`, `@drop`           | `DragEvent`     | dataTransfer                      |
| `@wheel`                   | `WheelEvent`    | deltaX, deltaY                    |
| `@touchstart`, `@touchend` | `TouchEvent`    | touches, changedTouches           |

## Element type assertions

Different form elements need different casts:

```ts
function handleTextInput(event: Event) {
  const input = event.target as HTMLInputElement
  console.log(input.value)
}

function handleCheckbox(event: Event) {
  const checkbox = event.target as HTMLInputElement
  console.log(checkbox.checked)
}

function handleSelect(event: Event) {
  const select = event.target as HTMLSelectElement
  console.log(select.value, select.selectedIndex)
}

function handleTextarea(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  console.log(textarea.value)
}
```

## Inline handlers

For simple cases, cast directly in the template:

```vue
<template>
  <input @input="name = ($event.target as HTMLInputElement).value" />
</template>
```

<PlaygroundLink code="<template>
  <input @input=&quot;name = ($event.target as HTMLInputElement).value&quot; />
</template>" />

Or use an inline arrow function:

```vue
<template>
  <input @input="(e: Event) => name = (e.target as HTMLInputElement).value" />
</template>
```

<PlaygroundLink code="<template>
  <input @input=&quot;(e: Event) => name = (e.target as HTMLInputElement).value&quot; />
</template>" />

## Custom component events

Vue component events (not DOM events) are typed through `defineEmits`. No casting needed because the payload type is defined by the child:

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  select: [item: { id: number; name: string }]
}>()
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const emit = defineEmits<{
  select: [item: { id: number; name: string }]
}>()
</script>" />

```vue
<!-- Parent.vue -->
<script setup lang="ts">
function handleSelect(item: { id: number; name: string }) {
  console.log(item.id) // fully typed
}
</script>

<template>
  <ChildComponent @select="handleSelect" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
function handleSelect(item: { id: number; name: string }) {
  console.log(item.id) // fully typed
}
</script>
&#10;<template>
  <ChildComponent @select=&quot;handleSelect&quot; />
</template>" />

## target vs currentTarget

```ts
function handleClick(event: MouseEvent) {
  // target: the actual element clicked (could be a child)
  const target = event.target as HTMLElement

  // currentTarget: the element the listener is on
  const button = event.currentTarget as HTMLButtonElement
}
```

If you have a button with a span inside, clicking the span makes `target` the span and `currentTarget` the button. Use `currentTarget` when you want the element the handler is attached to.

See also: [How do you emit events with TypeScript?](/q/emit-events-typescript) · [How does event handling work?](/q/event-handling)

## References

- [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) - Vue.js docs
- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
