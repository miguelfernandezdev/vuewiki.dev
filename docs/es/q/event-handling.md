---
order: 51
title: "¿Cómo funciona el manejo de eventos en Vue?"
difficulty: "beginner"
tags: ["directives", "components"]
---

Vue escucha eventos del DOM con la directiva `v-on`, abreviada como `@`. Enlazas un manejador directamente en el template, y Vue se encarga de adjuntar y eliminar el listener con el lifecycle del componente.

```vue
<template>
  <button @click="count++">Clicked {{ count }} times</button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

## Manejadores inline vs método

```vue
<template>
  <!-- Inline: la expresión se evalúa directamente -->
  <button @click="count++">+1</button>

  <!-- Método: referencia a una función -->
  <button @click="increment">+1</button>

  <!-- Método con argumentos -->
  <button @click="addAmount(5)">+5</button>

  <!-- Acceder al evento nativo junto con argumentos personalizados -->
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

## Modificadores de eventos

Los modificadores reemplazan patrones imperativos habituales como `event.preventDefault()` con sintaxis declarativa en el template.

```vue
<template>
  <!-- Prevenir el comportamiento predeterminado del navegador -->
  <form @submit.prevent="onSubmit">...</form>

  <!-- Detener la propagación a elementos padre -->
  <button @click.stop="doThis">Click</button>

  <!-- Disparar solo una vez -->
  <button @click.once="initialize">Init</button>

  <!-- Encadenar modificadores -->
  <a @click.stop.prevent="handleLink">Link</a>

  <!-- Solo disparar si el target del evento es el propio elemento, no un hijo -->
  <div @click.self="onDivClick">
    <button>Clicking here won't trigger onDivClick</button>
  </div>
</template>
```

## Modificadores de teclas

```vue
<template>
  <!-- Teclas específicas -->
  <input @keyup.enter="submit" />
  <input @keyup.escape="cancel" />

  <!-- Teclas modificadoras del sistema -->
  <input @keyup.ctrl.enter="submitAndClose" />
  <div @click.ctrl="selectMultiple">Hold Ctrl + click</div>

  <!-- .exact: solo disparar cuando estén presionados EXACTAMENTE estos modificadores -->
  <button @click.ctrl.exact="onCtrlClick">Ctrl + Click only</button>
</template>
```

## Modificadores de botón del ratón

```vue
<template>
  <div @click.left="onLeftClick">Left click</div>
  <div @click.right.prevent="onRightClick">Right click (no context menu)</div>
  <div @click.middle="onMiddleClick">Middle click</div>
</template>
```

## Referencia rápida

| Modificador | Reemplaza |
|---|---|
| `.prevent` | `event.preventDefault()` |
| `.stop` | `event.stopPropagation()` |
| `.once` | Elimina el listener tras el primer disparo |
| `.self` | Solo dispara si `event.target === element` |
| `.passive` | `addEventListener({ passive: true })` para rendimiento en scroll |
| `.capture` | Usa el modo de captura en lugar de bubbling |
