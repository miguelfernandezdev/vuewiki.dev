---
order: 48
title: "¿Cómo funciona el atributo `is` para el renderizado dinámico de componentes?"
difficulty: "intermediate"
tags: ["components", "vite"]
summary: "<component :is> acepta una definición de componente, un nombre registrado o una etiqueta HTML. Vue lo resuelve en tiempo de ejecución."
---

El atributo `is` en `<component>` acepta un objeto de definición de componente, un string con el nombre del componente o un string con el nombre de una etiqueta HTML. Vue lo resuelve en tiempo de ejecución y renderiza el componente o elemento correspondiente. Más allá del patrón estándar `<component :is>`, `is` tiene un comportamiento especial en elementos HTML nativos e interactúa con web components mediante el prefijo `vue:`.

## Qué acepta `:is`

```vue
<script setup>
import { shallowRef } from 'vue'
import AlertBox from './AlertBox.vue'
import InfoBox from './InfoBox.vue'

const currentComponent = shallowRef(AlertBox)
</script>

<template>
  <!-- 1. Objeto de definición de componente (recomendado) -->
  <component :is="currentComponent" />

  <!-- 2. Nombre de componente registrado (string) -->
  <component is="AlertBox" />

  <!-- 3. Nombre de elemento HTML (string) -->
  <component is="div" />

  <!-- 4. Función de render inline -->
  <component :is="() => h('span', 'hello')" />
</template>
```

Al usar una variable reactiva, usa `shallowRef` en lugar de `ref`. Un `ref` intentaría desempaquetar profundamente el objeto del componente, lo cual es innecesario y puede causar problemas con definiciones de componentes complejas.

## `is` en elementos HTML nativos

El atributo `is` en elementos HTML normales se comporta de forma distinta que en `<component>`. Sigue la especificación HTML para elementos integrados personalizados:

```vue
<!-- Comportamiento según la spec HTML: "is" en elementos nativos crea elementos integrados personalizados -->
<button is="my-custom-button">Click</button>
<!-- Esto le indica al navegador que actualice el <button> con una clase de custom element -->
```

Para renderizar un componente Vue como sustituto de un elemento nativo, usa el prefijo `vue:`:

```vue
<!-- Esto renderiza el componente Vue MyButton, no un <button> nativo -->
<button is="vue:MyButton">Click</button>

<!-- Útil cuando necesitas un componente Vue dentro de elementos con restricciones de hijos -->
<table>
  <tr is="vue:MyTableRow"></tr>
</table>
```

## El problema con `<table>`

Las reglas de parseo HTML restringen qué elementos pueden aparecer dentro de `<table>`, `<ul>`, `<ol>` y `<select>`. El navegador mueve los hijos no válidos fuera de estos elementos antes de que Vue vea el DOM:

```vue
<!-- MAL: el navegador mueve <BlogPost> fuera de <table> durante el parseo HTML -->
<table>
  <BlogPost />  <!-- acaba por encima de la tabla en el DOM -->
</table>

<!-- BIEN: usa is="vue:" para evitar la restricción -->
<table>
  <tr is="vue:BlogPost"></tr>
</table>
```

Esto solo es un problema cuando los templates se parsean como HTML (templates in-DOM). Los SFCs compilados con Vite no tienen este problema porque el template se compila en tiempo de build, no se parsea como HTML.

## Renderizado dinámico con un mapa de componentes

Un patrón habitual para renderizar distintos componentes según los datos:

```vue
<script setup>
import TextBlock from './TextBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import type { Component } from 'vue'

const blockComponents: Record<string, Component> = {
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock
}

const blocks = ref([
  { type: 'text', content: 'Hello' },
  { type: 'image', src: '/photo.jpg' },
  { type: 'text', content: 'World' },
  { type: 'video', src: '/clip.mp4' }
])
</script>

<template>
  <component
    v-for="(block, i) in blocks"
    :key="i"
    :is="blockComponents[block.type]"
    v-bind="block"
  />
</template>
```

Este patrón es más limpio que una cadena de `v-if`/`v-else-if` y escala a cualquier número de tipos de bloque sin modificar el template.

## Orden de resolución

Cuando `:is` recibe un string, Vue lo resuelve en este orden:

1. Componentes registrados localmente (mediante `import` en `<script setup>`)
2. Componentes registrados globalmente (`app.component('name', ...)`)
3. Elementos HTML nativos (`div`, `span`, `table`, etc.)

Si el string no coincide con ningún componente ni elemento HTML, Vue no renderiza nada y emite un warning en desarrollo.

## Combinado con KeepAlive y Transition

```vue
<template>
  <KeepAlive :max="5">
    <Transition name="fade" mode="out-in">
      <component :is="currentTab" :key="currentTabName" />
    </Transition>
  </KeepAlive>
</template>
```

Añade `:key` al usar `<Transition>` para que Vue trate cada cambio de componente como una transición entre elementos distintos, en lugar de parchear el mismo componente.

Ver también: [¿Qué son los componentes dinámicos y KeepAlive?](/es/q/dynamic-components-keepalive) · [¿Cómo funcionan las render functions?](/es/q/render-functions-jsx)

## Referencias

- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
- [component](https://vuejs.org/api/built-in-special-elements.html#component) - Vue.js docs
- [is attribute](https://vuejs.org/api/built-in-special-attributes.html#is) - Vue.js docs
