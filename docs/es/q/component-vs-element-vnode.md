---
order: 43
title: '¿Cuál es la diferencia entre un componente y un elemento en Vue?'
difficulty: 'intermediate'
tags: ['components', 'core']
summary: 'Un elemento es una etiqueta HTML (<div>, <button>). Un componente es una unidad de UI reutilizable con su propio estado, ciclo de vida, props y emit.'
---

Un elemento es una etiqueta HTML simple (`<div>`, `<button>`, `<input>`). Un componente es una pieza de UI reutilizable definida por ti (`<UserCard>`, `<Modal>`, `<AppHeader>`). Ambos producen [VNodes](https://vuejs.org/guide/extras/rendering-mechanism.html#virtual-dom) (nodos del Virtual DOM) en tiempo de renderizado, pero Vue los gestiona de forma diferente: los elementos se corresponden directamente con nodos del DOM, mientras que los componentes pasan por un ciclo de vida de instancia (props, setup, estado reactivo, slots, emit) antes de renderizar su propio árbol de elementos.

## En los templates

```vue
<template>
  <!-- Elemento: se corresponde con un <div> real en el DOM -->
  <div class="container">
    <!-- Componente: Vue crea una instancia, ejecuta setup, renderiza su template -->
    <UserCard :user="user" @click="selectUser" />

    <!-- Elemento: se corresponde con un <p> real -->
    <p>{{ user.bio }}</p>
  </div>
</template>
```

<PlaygroundLink code="<template>

  <!-- Elemento: se corresponde con un <div> real en el DOM -->
  <div class=&quot;container&quot;>
    <!-- Componente: Vue crea una instancia, ejecuta setup, renderiza su template -->
    <UserCard :user=&quot;user&quot; @click=&quot;selectUser&quot; />
&#10;    <!-- Elemento: se corresponde con un <p> real -->
    <p>{{ user.bio }}</p>
  </div>
</template>" />

El compilador de templates de Vue los trata de forma diferente. Cuando ve una etiqueta en minúsculas (`div`, `span`, `input`), crea un VNode de elemento. Cuando ve un nombre registrado en PascalCase o kebab-case (`UserCard`, `user-card`), crea un VNode de componente.

## Qué es un VNode

Un VNode (Virtual Node) es un objeto JavaScript simple que describe lo que debe renderizarse. Vue construye un árbol de VNodes (el Virtual DOM), lo compara con el árbol anterior y aplica los cambios mínimos al DOM. Puedes crear VNodes manualmente usando el [helper `h()`](https://vuejs.org/api/render-function.html#h).

```js
import { h } from 'vue'

// VNode de elemento: describe un <div>
const elementVNode = h('div', { class: 'box' }, 'Hello')
// { type: 'div', props: { class: 'box' }, children: 'Hello' }

// VNode de componente: describe una instancia de <UserCard>
const componentVNode = h(UserCard, { user: someUser })
// { type: UserCard, props: { user: someUser }, children: null }
```

El campo `type` es la diferencia clave. Para elementos, `type` es una cadena (`'div'`). Para componentes, `type` es el objeto de definición del componente (o una función setup).

## Cómo procesa Vue cada uno

**VNode de elemento** (`type: 'div'`):

1. Crea o parchea el nodo del DOM
2. Aplica atributos, listeners de eventos y estilos
3. Procesa los hijos de forma recursiva

**VNode de componente** (`type: UserCard`):

1. Crea una instancia del componente (contexto reactivo, props, slots)
2. Ejecuta `setup()` o el equivalente de la Options API
3. Renderiza el template del componente en su propio árbol de VNodes
4. Procesa ese árbol de forma recursiva (que eventualmente termina en VNodes de elemento)

Todo componente, por complejo que sea, acaba resolviendo en un árbol de VNodes de elemento. Los componentes son una capa de abstracción sobre los elementos.

## Visto en funciones de render

```js
import { h, defineComponent } from 'vue'

const Greeting = defineComponent({
  props: { name: String },
  setup(props) {
    return () => h('p', `Hello, ${props.name}`)
    //          ↑ VNode de elemento ('p')
  }
})

// Usar el componente produce un VNode de componente
const app = () => h(Greeting, { name: 'Alice' })
//                 ↑ VNode de componente (Greeting)
```

Cuando Vue renderiza `app`, encuentra el VNode del componente `Greeting`, crea una instancia, llama a `setup`, obtiene el VNode de elemento `h('p', ...)` y lo renderiza al DOM. El DOM final solo contiene `<p>Hello, Alice</p>`. No hay ninguna etiqueta `<Greeting>`.

## En Vue DevTools

Vue DevTools muestra ambos niveles. La pestaña Components muestra el árbol de componentes (`App > Greeting`). La pestaña Elements del navegador solo muestra elementos del DOM (`<div id="app"> <p>Hello, Alice</p> </div>`). Los límites de los componentes existen en el Virtual DOM de Vue, no en el DOM real.

## Diferencia práctica

|                         | Elemento                | Componente                               |
| ----------------------- | ----------------------- | ---------------------------------------- |
| Qué es                  | Etiqueta HTML           | Unidad de UI reutilizable                |
| Tipo del VNode          | Cadena (`'div'`)        | Objeto de componente                     |
| Tiene instancia         | No                      | Sí (estado reactivo, lifecycle)          |
| Tiene props/emit        | No (tiene atributos)    | Sí                                       |
| Tiene slots             | No                      | Sí                                       |
| Aparece en el DOM       | Sí                      | No (su output del template sí)           |
| Visibilidad en DevTools | Pestaña Elements        | Pestaña Components                       |
| Coste                   | Bajo (solo un nodo DOM) | Mayor (instancia + setup de reactividad) |

Ver también: [¿Qué es el Virtual DOM y cómo lo usa Vue?](/es/q/virtual-dom)

## Referencias

- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
- [Components Basics](https://vuejs.org/guide/essentials/component-basics.html) - Vue.js docs
