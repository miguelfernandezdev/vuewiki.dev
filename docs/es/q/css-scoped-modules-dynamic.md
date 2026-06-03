---
order: 21
title: '¿Cómo funcionan los estilos con scoped, CSS Modules y clases dinámicas en Vue?'
difficulty: 'beginner'
tags: ['components', 'styling', 'teleport']
summary: 'Scoped styles añade atributos data-v para aislar. CSS Modules genera hash en nombres de clase. :class y :style enlazan clases/estilos dinámicamente.'
---

Los Single-File Components de Vue ofrecen tres formas de aplicar estilos a los componentes, cada una resolviendo un problema diferente.

## Estilos con scoped

Añadir `scoped` a un bloque `<style>` limita el CSS al componente actual. Vue añade un atributo único `data-v-xxxxx` a cada elemento del template y lo añade a cada selector.

```vue
<style scoped>
.title {
  color: blue;
}
/* Compila a: .title[data-v-abc123] { color: blue; } */
</style>
```

<PlaygroundLink code="<style scoped>
.title {
  color: blue;
}
/* Compila a: .title[data-v-abc123] { color: blue; } */
</style>" />

Los estilos no se filtran a componentes padre o hermanos. Los internos de los componentes hijos tampoco se ven afectados (excepto el elemento raíz del hijo).

## CSS Modules

CSS Modules hace hash de los nombres de clase en tiempo de compilación. Los enlazas a través de `$style` en lugar de escribir nombres de clase simples.

```vue
<template>
  <h1 :class="$style.title">Hello</h1>
</template>

<style module>
.title {
  color: blue;
}
/* Compila a: .title_abc1 { color: blue; } */
</style>
```

<PlaygroundLink code="<template>

  <h1 :class=&quot;$style.title&quot;>Hello</h1>
</template>
&#10;<style module>
.title {
  color: blue;
}
/* Compila a: .title_abc1 { color: blue; } */
</style>" />

La ventaja frente a los estilos con scoped: los nombres con hash funcionan en cualquier lugar del DOM, así que son seguros para contenido teleportado, elementos dinámicos e integraciones de terceros.

## Clases dinámicas

Vue ofrece varias sintaxis para enlazar clases dinámicamente.

```vue
<template>
  <!-- Sintaxis de objeto: la clave es el nombre de clase, el valor es la condición -->
  <div :class="{ active: isActive, disabled: isDisabled }">...</div>

  <!-- Sintaxis de array: combina varias fuentes -->
  <div :class="[baseClass, { active: isActive }]">...</div>

  <!-- Con CSS Modules -->
  <div :class="[$style.card, { [$style.active]: isActive }]">...</div>
</template>

<script setup>
import { ref } from 'vue'

const isActive = ref(true)
const isDisabled = ref(false)
const baseClass = ref('card')
</script>
```

<PlaygroundLink code="<template>

  <!-- Sintaxis de objeto: la clave es el nombre de clase, el valor es la condición -->
  <div :class=&quot;{ active: isActive, disabled: isDisabled }&quot;>...</div>
&#10;  <!-- Sintaxis de array: combina varias fuentes -->
  <div :class=&quot;[baseClass, { active: isActive }]&quot;>...</div>
&#10;  <!-- Con CSS Modules -->
  <div :class=&quot;[$style.card, { [$style.active]: isActive }]&quot;>...</div>
</template>
&#10;<script setup>
import { ref } from 'vue'
&#10;const isActive = ref(true)
const isDisabled = ref(false)
const baseClass = ref('card')
</script>" />

## Estilos inline dinámicos

```vue
<template>
  <!-- Sintaxis de objeto -->
  <div :style="{ color: textColor, fontSize: size + 'px' }">...</div>

  <!-- Sintaxis de array: combina varios objetos de estilo -->
  <div :style="[baseStyles, overrideStyles]">...</div>
</template>
```

<PlaygroundLink code="<template>

  <!-- Sintaxis de objeto -->
  <div :style=&quot;{ color: textColor, fontSize: size + 'px' }&quot;>...</div>
&#10;  <!-- Sintaxis de array: combina varios objetos de estilo -->
  <div :style=&quot;[baseStyles, overrideStyles]&quot;>...</div>
</template>" />

Vue añade automáticamente prefijos de vendor para propiedades CSS específicas del navegador, así que no necesitas escribir `-webkit-` ni `-moz-` tú mismo.

## Cuándo usar cada opción

| Necesidad                             | Usar                                      |
| ------------------------------------- | ----------------------------------------- |
| Aislamiento simple del componente     | `<style scoped>`                          |
| Contenido teleportado o dinámico      | `<style module>`                          |
| Alternar una clase según el estado    | `:class="{ active: isActive }"`           |
| Combinar clases estáticas y dinámicas | `:class="['base', { active: isActive }]"` |
| Sobrescrituras inline puntuales       | `:style="{ color: x }"`                   |

Ver también: [¿Por qué el CSS scoped no estila elementos de componentes hijos?](/es/q/scoped-css-child-components) · [¿Cómo interactúan los estilos scoped con Teleport?](/es/q/teleport-scoped-styles)

## Referencias

- [Scoped CSS](https://vuejs.org/api/sfc-css-features.html#scoped-css) - Vue.js docs
- [CSS Modules](https://vuejs.org/api/sfc-css-features.html#css-modules) - Vue.js docs
- [v-bind() in CSS](https://vuejs.org/api/sfc-css-features.html#v-bind-in-css) - Vue.js docs
