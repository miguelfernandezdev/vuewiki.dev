---
order: 61
title: "¿Cómo se crean directivas personalizadas en Vue?"
difficulty: "intermediate"
tags: ["directives"]
---

Las directivas personalizadas te dan acceso de bajo nivel a los elementos del DOM cuando las directivas integradas (`v-if`, `v-show`, `v-model`) no son suficientes. Son ideales para cosas como auto-focus, intersection observers o integración con librerías de terceros.

## Sintaxis básica

Una directiva es un objeto con lifecycle hooks que reciben el elemento y un objeto binding.

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

En `<script setup>`, cualquier variable que empiece por `v` seguida de una letra mayúscula está automáticamente disponible como directiva en el template.

## Atajo de función

Si solo necesitas lógica en `mounted` y `updated` (el caso más común), usa una función simple:

```vue
<script setup>
const vFocus = (el: HTMLElement) => el.focus()
</script>

<template>
  <input v-focus />
</template>
```

## Lifecycle hooks de la directiva

```ts
const vExample = {
  created(el, binding) {},      // antes de que se apliquen los attrs/eventos del elemento
  beforeMount(el, binding) {},  // antes de insertarlo en el DOM
  mounted(el, binding) {},      // elemento insertado en el DOM
  beforeUpdate(el, binding) {}, // antes de que el componente padre se actualice
  updated(el, binding) {},      // después de que el componente padre se haya actualizado
  beforeUnmount(el, binding) {},
  unmounted(el, binding) {}     // elemento eliminado del DOM
}
```

El objeto `binding` contiene:

| Propiedad | Descripción |
|---|---|
| `value` | El valor actual pasado a la directiva |
| `oldValue` | El valor anterior (solo en `updated`) |
| `arg` | El argumento después de los dos puntos (`v-dir:arg`) |
| `modifiers` | Un objeto de modificadores (`v-dir.mod` da `{ mod: true }`) |

## Usar argumentos, modificadores y valores

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

## Limpieza en unmounted

Cualquier efecto secundario (listeners, observers, timers) debe limpiarse para evitar pérdidas de memoria.

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

## Registro global

Para directivas usadas en toda la aplicación, regístralas en la instancia de la aplicación:

```ts
// main.ts
const app = createApp(App)

app.directive('focus', {
  mounted(el) { el.focus() }
})
```

## Cuándo usar directivas frente a composables frente a componentes

| Necesidad | Usar |
|---|---|
| Manipulación directa del DOM (foco, scroll, atributos) | Directiva |
| Lógica reutilizable con estado (fetch, debounce, timers) | Composable |
| UI reutilizable con template/estructura | Componente |

Las directivas deben mantenerse simples. Si te encuentras gestionando estado complejo o emitiendo eventos dentro de una directiva, probablemente quieras un composable o un componente.
