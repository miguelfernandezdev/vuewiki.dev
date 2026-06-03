---
order: 109
title: '¿Cómo se tipan los manejadores de eventos en los templates de Vue?'
difficulty: 'intermediate'
tags: ['typescript', 'components']
summary: 'Tipar el parámetro del evento (e: Event) y castear event.target al tipo correcto (e.target as HTMLInputElement) para acceder a .value o .checked.'
---

Los manejadores de eventos DOM en templates de Vue reciben un objeto `Event`, pero TypeScript no sabe qué elemento específico lo disparó. Necesitas tipar el parámetro del evento explícitamente y hacer un cast de `event.target` al tipo de elemento correcto para acceder a propiedades como `.value` o `.checked`.

## El problema

```ts
// error en modo estricto: 'any' implícito
function handleInput(event) {
  console.log(event.target.value)
}

// error: 'value' no existe en EventTarget
function handleInput(event: Event) {
  console.log(event.target.value)
}
```

`event.target` tiene el tipo `EventTarget | null`, que no tiene la propiedad `.value`. Necesitas una aserción de tipo.

## La solución

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

## Referencia de tipos de evento

| Evento en el template      | Tipo TypeScript | Propiedades clave                 |
| -------------------------- | --------------- | --------------------------------- |
| `@click`, `@dblclick`      | `MouseEvent`    | clientX, clientY, button, ctrlKey |
| `@keydown`, `@keyup`       | `KeyboardEvent` | key, code, ctrlKey, shiftKey      |
| `@input`, `@change`        | `Event`         | target (requiere cast)            |
| `@focus`, `@blur`          | `FocusEvent`    | relatedTarget                     |
| `@submit`                  | `SubmitEvent`   | submitter                         |
| `@drag`, `@drop`           | `DragEvent`     | dataTransfer                      |
| `@wheel`                   | `WheelEvent`    | deltaX, deltaY                    |
| `@touchstart`, `@touchend` | `TouchEvent`    | touches, changedTouches           |

## Aserciones de tipo por elemento

Los distintos elementos de formulario necesitan casts diferentes:

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

## Manejadores inline

Para casos simples, haz el cast directamente en el template:

```vue
<template>
  <input @input="name = ($event.target as HTMLInputElement).value" />
</template>
```

<PlaygroundLink code="<template>
  <input @input=&quot;name = ($event.target as HTMLInputElement).value&quot; />
</template>" />

O usa una arrow function inline:

```vue
<template>
  <input @input="(e: Event) => name = (e.target as HTMLInputElement).value" />
</template>
```

<PlaygroundLink code="<template>
  <input @input=&quot;(e: Event) => name = (e.target as HTMLInputElement).value&quot; />
</template>" />

## Eventos de componentes personalizados

Los eventos de componentes Vue (no eventos DOM) se tipan a través de `defineEmits`. No se necesita cast porque el tipo del payload lo define el hijo:

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  select: [item: { id: number; name: string }]
}>()
</script>
```

<PlaygroundLink code="<!-- ChildComponent.vue -->

<script setup lang=&quot;ts&quot;>
const emit = defineEmits<{
  select: [item: { id: number; name: string }]
}>()
</script>" />

```vue
<!-- Parent.vue -->
<script setup lang="ts">
function handleSelect(item: { id: number; name: string }) {
  console.log(item.id) // completamente tipado
}
</script>

<template>
  <ChildComponent @select="handleSelect" />
</template>
```

<PlaygroundLink code="<!-- Parent.vue -->

<script setup lang=&quot;ts&quot;>
function handleSelect(item: { id: number; name: string }) {
  console.log(item.id) // completamente tipado
}
</script>

&#10;<template>
<ChildComponent @select=&quot;handleSelect&quot; />
</template>" />

## target vs currentTarget

```ts
function handleClick(event: MouseEvent) {
  // target: el elemento real que se clicó (puede ser un hijo)
  const target = event.target as HTMLElement

  // currentTarget: el elemento al que está asociado el listener
  const button = event.currentTarget as HTMLButtonElement
}
```

Si tienes un botón con un span dentro, al clicar el span, `target` es el span y `currentTarget` es el botón. Usa `currentTarget` cuando quieras el elemento al que está adjunto el manejador.

Ver también: [¿Cómo emitir eventos con TypeScript?](/es/q/emit-events-typescript) · [¿Cómo funciona el manejo de eventos?](/es/q/event-handling)

## Referencias

- [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) - Vue.js docs
- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
