---
order: 12
title: '¿Cómo funciona el manejo de eventos en Vue?'
difficulty: 'beginner'
tags: ['directives', 'components']
summary: 'v-on (o @) enlaza listeners de eventos DOM en el template. Vue los adjunta y elimina automáticamente con el ciclo de vida del componente.'
---

Vue escucha eventos del DOM con la directiva [`v-on`](https://vuejs.org/api/built-in-directives.html#v-on), abreviada como `@`. Enlazas un manejador directamente en el template, y Vue se encarga de adjuntar y eliminar el listener con el lifecycle del componente.

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

<PlaygroundLink code="<template>
&#10;  <form @submit.prevent=&quot;onSubmit&quot;>...</form>
&#10;  <button @click.stop=&quot;doThis&quot;>Click</button>
&#10;  <button @click.once=&quot;initialize&quot;>Init</button>
&#10;  <a @click.stop.prevent=&quot;handleLink&quot;>Link</a>
&#10;  <div @click.self=&quot;onDivClick&quot;>
    <button>Clicking here won't trigger onDivClick</button>
  </div>
</template>" />

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

<PlaygroundLink code="<template>
&#10;  <input @keyup.enter=&quot;submit&quot; />
  <input @keyup.escape=&quot;cancel&quot; />
&#10;  <input @keyup.ctrl.enter=&quot;submitAndClose&quot; />
  <div @click.ctrl=&quot;selectMultiple&quot;>Hold Ctrl + click</div>
&#10;  <button @click.ctrl.exact=&quot;onCtrlClick&quot;>Ctrl + Click only</button>
</template>" />

## Modificadores de botón del ratón

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

## Referencia rápida

| Modificador | Reemplaza                                                        |
| ----------- | ---------------------------------------------------------------- |
| `.prevent`  | `event.preventDefault()`                                         |
| `.stop`     | `event.stopPropagation()`                                        |
| `.once`     | Elimina el listener tras el primer disparo                       |
| `.self`     | Solo dispara si `event.target === element`                       |
| `.passive`  | `addEventListener({ passive: true })` para rendimiento en scroll |
| `.capture`  | Usa el modo de captura en lugar de bubbling                      |

Ver también: [¿En qué orden deben ir los modificadores de evento?](/es/q/event-modifier-order) · [¿Qué es el renderizado condicional en Vue?](/es/q/conditional-rendering)

## Referencias

- [Manejo de Eventos](https://vuejs.org/guide/essentials/event-handling.html) - Docs de Vue.js
- [v-on](https://vuejs.org/api/built-in-directives.html#v-on) - Docs de Vue.js
