---
order: 18
title: "¿Qué son los modificadores de eventos y por qué importa el orden?"
difficulty: "intermediate"
tags: ["directives"]
summary: "Los modificadores se compilan de izquierda a derecha — .prevent.self y .self.prevent producen comportamientos distintos. El orden importa."
---

Los modificadores de eventos son sufijos en `v-on` (o `@`) que gestionan patrones comunes de eventos de forma declarativa. Vue los compila a JavaScript en el orden exacto en que los escribes, y ese orden cambia el comportamiento.

## El orden importa

Vue genera el código de cada modificador de izquierda a derecha. `.prevent.self` y `.self.prevent` producen resultados diferentes:

```ts
// @click.prevent.self compila a:
event.preventDefault()               // se ejecuta primero, en TODOS los clics
if (event.target !== event.currentTarget) return
handler()

// @click.self.prevent compila a:
if (event.target !== event.currentTarget) return  // comprueba primero
event.preventDefault()               // solo se ejecuta si el clic fue en el propio elemento
handler()
```

En la práctica:

```vue
<template>
  <!-- .prevent.self: previene el comportamiento predeterminado también en los hijos -->
  <div @click.prevent.self="handleClick">
    <a href="/page">Link</a> <!-- el default se previene aunque el clic sea en el hijo -->
  </div>

  <!-- .self.prevent: solo previene el default en el propio div -->
  <div @click.self.prevent="handleClick">
    <a href="/page">Link</a> <!-- la navegación funciona con normalidad -->
  </div>
</template>
```

## Todos los modificadores de eventos

| Modificador | Qué hace |
|---|---|
| `.prevent` | Llama a `event.preventDefault()` |
| `.stop` | Llama a `event.stopPropagation()` |
| `.self` | Solo se dispara si `event.target === event.currentTarget` |
| `.once` | Elimina el listener tras el primer disparo |
| `.capture` | Usa la fase de captura en lugar de bubbling |
| `.passive` | Establece `{ passive: true }` en el listener (mejora el rendimiento del scroll) |

## Combinaciones habituales

```vue
<template>
  <!-- Detener propagación Y prevenir default (el orden no importa aquí) -->
  <a @click.stop.prevent="handleClick">Link</a>

  <!-- Disparar solo una vez, en fase de captura -->
  <div @click.capture.once="handleOnce">...</div>

  <!-- Solo disparar si se pulsa EXACTAMENTE Ctrl (sin Shift, sin Alt) -->
  <button @click.ctrl.exact="onCtrlClick">Ctrl+Click</button>

  <!-- Prevenir el envío del formulario, gestionar en JavaScript -->
  <form @submit.prevent="onSubmit">...</form>
</template>
```

## Cuándo el orden no importa

Para la mayoría de combinaciones, el orden es irrelevante. `.stop.prevent` y `.prevent.stop` llaman a `stopPropagation()` y `preventDefault()` incondicionalmente.

El orden solo importa cuando un modificador es condicional (`.self`) y el otro tiene efectos secundarios (`.prevent`, `.stop`). En esos casos, piensa si el efecto secundario debe ejecutarse antes o después de la comprobación condicional.

## Cuándo usar manejadores separados

Si la cadena de modificadores se vuelve confusa, divide la lógica en manejadores explícitos:

```vue
<template>
  <div @click.self="handleSelfClick">
    <button @click.prevent="handleChildClick">
      Child
    </button>
  </div>
</template>
```

La claridad es más valiosa que la brevedad.

Ver también: [¿Cómo inyectar HTML crudo en Vue?](/es/q/v-html-xss) · [¿Por qué no se puede usar v-if y v-for en el mismo elemento?](/es/q/v-if-with-v-for) · [¿Por qué v-show no funciona en elementos template?](/es/q/v-show-template-limitation)

## Referencias

- [Event Modifiers](https://vuejs.org/guide/essentials/event-handling.html#event-modifiers) - Vue.js docs
- [Key Modifiers](https://vuejs.org/guide/essentials/event-handling.html#key-modifiers) - Vue.js docs
- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
