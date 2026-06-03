---
order: 2
title: '¿Qué es el Virtual DOM y cómo lo usa Vue?'
difficulty: 'beginner'
tags: ['core', 'reactivity']
summary: 'Un árbol JS ligero de vnodes. Vue compara el árbol nuevo con el anterior y aplica solo las operaciones DOM mínimas necesarias.'
---

El [Virtual DOM](https://vuejs.org/guide/extras/rendering-mechanism.html#virtual-dom) es una representación JavaScript ligera del DOM real. En lugar de manipular directamente el DOM del navegador en cada cambio, Vue construye un árbol de objetos planos (vnodes), compara el nuevo árbol con el anterior y aplica solo el conjunto mínimo de operaciones DOM necesarias.

## Cómo funciona

1. Tu template se compila en una **función de render** que devuelve vnodes.
2. Cuando cambia el estado reactivo, Vue vuelve a ejecutar la función de render para producir un **nuevo árbol de vnodes**.
3. Vue **compara** (o "parchea") el nuevo árbol con el anterior.
4. Solo las diferencias se aplican al DOM real.

```
Cambios de estado → nuevo árbol de vnodes → comparar con árbol anterior → parchear el DOM real
```

```ts
// Cómo es un vnode internamente (simplificado)
const vnode = {
  type: 'div',
  props: { class: 'card' },
  children: [
    { type: 'h2', children: 'Title' },
    { type: 'p', children: 'Content' }
  ]
}
```

## ¿Por qué no actualizar el DOM directamente?

Las operaciones del DOM real son costosas. Leer `element.offsetHeight` provoca un recálculo del layout. Insertar un nodo puede causar reflows en toda la página. Al agrupar los cambios a través de una capa virtual, Vue minimiza la frecuencia con la que toca el DOM real.

```vue
<script setup>
import { ref } from 'vue'

const items = ref(['a', 'b', 'c'])

function addItem() {
  items.value.push('d')
  items.value.push('e')
  // Vue agrupa ambos cambios en una sola actualización del DOM
}
</script>
```

<PlaygroundLink code="<script setup>
import { ref } from 'vue'
&#10;const items = ref(['a', 'b', 'c'])
&#10;function addItem() {
  items.value.push('d')
  items.value.push('e')
  // Vue agrupa ambos cambios en una sola actualización del DOM
}
</script>" />

## Las optimizaciones de Vue sobre una comparación ingenua

El [compilador de Vue](https://vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom) analiza tus templates en tiempo de compilación y añade pistas que hacen la comparación en tiempo de ejecución más rápida:

- **Elevación de estáticos.** Los elementos que nunca cambian se crean una vez y se reutilizan en cada re-render.
- **Flags de parche.** Los bindings dinámicos se etiquetan para que la comparación omita las partes estáticas por completo.
- **Aplanamiento del árbol.** Solo los nodos con contenido dinámico se incluyen en el recorrido de comparación.

```vue
<template>
  <div>
    <h1>Static title</h1>
    <!-- elevado, omitido en la comparación -->
    <p>{{ dynamicContent }}</p>
    <!-- flag de parche: TEXT -->
    <span :class="activeClass">ok</span>
    <!-- flag de parche: CLASS -->
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div>
    <h1>Static title</h1>
&#10;    <p>{{ dynamicContent }}</p>
&#10;    <span :class=&quot;activeClass&quot;>ok</span>
&#10;  </div>
</template>" />

## Virtual DOM frente a sin Virtual DOM

Algunos frameworks (Svelte, SolidJS) prescinden por completo del Virtual DOM y compilan los templates directamente a instrucciones DOM. Vue eligió el Virtual DOM porque habilita la API de funciones de render, el soporte de JSX y la manipulación programática de vnodes, siendo al mismo tiempo suficientemente rápido para prácticamente todos los casos de uso.

| Enfoque         | Frameworks      | Compromiso                                      |
| --------------- | --------------- | ----------------------------------------------- |
| Virtual DOM     | Vue, React      | API flexible, ligero coste de la comparación    |
| Sin Virtual DOM | Svelte, SolidJS | Menos coste, pero control programático limitado |

Ver también: [¿Cuál es la diferencia entre un componente y un elemento?](/es/q/component-vs-element-vnode), [¿Qué es Vue y cuáles son sus características principales?](/es/q/what-is-vue)

## Referencias

- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
