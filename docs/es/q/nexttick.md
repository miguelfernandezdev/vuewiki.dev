---
order: 74
title: '¿Qué es nextTick y cuándo lo necesitas?'
difficulty: 'intermediate'
tags: ['reactivity', 'watchers']
summary: 'nextTick espera a que Vue termine de actualizar el DOM tras un cambio de estado. Úsalo cuando necesites leer el DOM inmediatamente después de cambiar estado.'
---

[nextTick](https://vuejs.org/api/general.html#nexttick) es una utilidad que permite esperar hasta que Vue haya terminado de actualizar el DOM después de un cambio de state. Vue agrupa las actualizaciones del DOM de forma asíncrona por rendimiento, así que si lees el DOM justo después de cambiar state reactivo, verás valores obsoletos.

## El problema

```ts
import { ref } from 'vue'

const message = ref('Hello')
const messageEl = ref<HTMLElement | null>(null)

function update() {
  message.value = 'Updated!'

  // El DOM todavía muestra "Hello" aquí
  console.log(messageEl.value?.textContent) // "Hello"
}
```

Vue cambió `message` en memoria, pero el DOM todavía no se ha re-renderizado. La actualización ocurre en la siguiente microtarea.

## La solución

```ts
import { ref, nextTick } from 'vue'

const message = ref('Hello')
const messageEl = ref<HTMLElement | null>(null)

async function update() {
  message.value = 'Updated!'

  await nextTick()

  // El DOM ahora está actualizado
  console.log(messageEl.value?.textContent) // "Updated!"
}
```

`nextTick` también acepta un callback:

```ts
function update() {
  message.value = 'Updated!'

  nextTick(() => {
    console.log(messageEl.value?.textContent) // "Updated!"
  })
}
```

## Casos de uso habituales

**Desplazarse al nuevo contenido tras añadir elementos:**

```ts
const items = ref<string[]>([])
const listEl = ref<HTMLElement | null>(null)

async function addItem(text: string) {
  items.value.push(text)

  await nextTick()
  listEl.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
}
```

**Enfocar un input después de que aparezca:**

```ts
const showInput = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

async function openSearch() {
  showInput.value = true

  await nextTick()
  inputEl.value?.focus()
}
```

**Medir dimensiones de un elemento tras cambios de contenido:**

```ts
const content = ref('')
const containerEl = ref<HTMLElement | null>(null)

async function loadContent(text: string) {
  content.value = text

  await nextTick()
  const height = containerEl.value?.offsetHeight
  console.log('Nueva altura:', height)
}
```

## Cuándo no necesitas nextTick

Si puedes resolver el problema con datos reactivos en lugar de leer el DOM, no necesitas `nextTick`. Los watchers y computed ya se ejecutan después de que los cambios de state se asientan, por lo que siempre ven los valores más recientes.

```ts
// No se necesita nextTick: computed reacciona al state, no al DOM
const isEmpty = computed(() => items.value.length === 0)

// No se necesita nextTick: watch se dispara después de que el state se asienta
watch(items, (newItems) => {
  console.log('Items cambiaron:', newItems.length)
})
```

Reserva `nextTick` para cuando genuinamente necesites interactuar con el DOM (desplazamiento, enfoque, medición).

Ver también: [¿Cómo agrupa Vue las actualizaciones del DOM?](/es/q/dom-update-batching) · [¿Cuándo usar el hook updated?](/es/q/perf-updated-hook)

## Referencias

- [nextTick() - Vue docs](https://vuejs.org/api/general.html#nexttick)
- [watch() - Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Reactividad en profundidad - Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
