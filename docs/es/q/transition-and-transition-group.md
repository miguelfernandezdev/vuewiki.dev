---
order: 36
title: '¿Cómo funcionan Transition y TransitionGroup?'
difficulty: 'intermediate'
tags: ['components', 'animation']
summary: '<Transition> anima un elemento al entrar/salir. <TransitionGroup> anima elementos de lista. Ambos usan clases CSS para las etapas enter/leave.'
---

Vue incluye dos componentes integrados para animación. `<Transition>` anima un único elemento al entrar o salir. `<TransitionGroup>` anima elementos en una lista.

## Transition

Envuelve un único elemento (o componente) que alterna con `v-if` o `v-show`. Vue añade clases CSS en cada etapa del ciclo de entrada y salida.

```vue
<template>
  <button @click="show = !show">Alternar</button>

  <Transition name="fade">
    <p v-if="show">Hola</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

<PlaygroundLink code="<template>
  <button @click=&quot;show = !show&quot;>Alternar</button>
&#10;  <Transition name=&quot;fade&quot;>
    <p v-if=&quot;show&quot;>Hola</p>
  </Transition>
</template>
&#10;<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
&#10;.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>" />

El patrón de nombres de clase con un `name` de `"fade"`:

```
.fade-enter-from   → .fade-enter-active → .fade-enter-to
.fade-leave-from   → .fade-leave-active → .fade-leave-to
```

## Modos de Transition

Al intercambiar entre dos elementos, ambos son visibles al mismo tiempo por defecto. Usa `mode="out-in"` para animar la salida del elemento antiguo primero, y luego la entrada del nuevo.

```vue
<template>
  <Transition name="fade" mode="out-in">
    <p v-if="isActive" key="active">Activo</p>
    <p v-else key="inactive">Inactivo</p>
  </Transition>
</template>
```

<PlaygroundLink code="<template>
  <Transition name=&quot;fade&quot; mode=&quot;out-in&quot;>
    <p v-if=&quot;isActive&quot; key=&quot;active&quot;>Activo</p>
    <p v-else key=&quot;inactive&quot;>Inactivo</p>
  </Transition>
</template>" />

Añade `key` cuando intercambias elementos del mismo tipo (`<p>` por `<p>`), de lo contrario Vue reutiliza el nodo DOM y la transición no se activa.

## Consejo de rendimiento

Usa solo `transform` y `opacity`. Estas propiedades están aceleradas por GPU y no desencadenan recálculos de layout.

```css
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-12px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(12px);
  opacity: 0;
}
```

Evita animar `height`, `width`, `margin` o `top`, ya que provocan costosos recálculos de layout.

## TransitionGroup

Para listas renderizadas con `v-for`. Cada hijo debe tener un `:key` único.

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Anima los elementos restantes cuando se elimina uno */
.list-move {
  transition: transform 0.3s ease;
}

.list-leave-active {
  position: absolute;
}
</style>
```

<PlaygroundLink code="<template>
  <TransitionGroup name=&quot;list&quot; tag=&quot;ul&quot;>
    <li v-for=&quot;item in items&quot; :key=&quot;item.id&quot;>
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>
&#10;<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
&#10;.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
&#10;/* Anima los elementos restantes cuando se elimina uno */
.list-move {
  transition: transform 0.3s ease;
}
&#10;.list-leave-active {
  position: absolute;
}
</style>" />

La clase `.list-move` anima los elementos que cambian de posición cuando un hermano entra o sale. Establecer `position: absolute` en el elemento que sale permite que los restantes fluyan a su lugar de forma fluida.

## Animaciones de lista escalonadas

Usa hooks de JavaScript con `data-index` para efectos en cascada:

```vue
<template>
  <TransitionGroup
    tag="ul"
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
  >
    <li v-for="(item, index) in items" :key="item.id" :data-index="index">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<script setup>
function onBeforeEnter(el: HTMLElement) {
  el.style.opacity = '0'
  el.style.transform = 'translateY(12px)'
}

function onEnter(el: HTMLElement, done: () => void) {
  const delay = Number(el.dataset.index) * 80
  setTimeout(() => {
    el.style.transition = 'all 0.25s ease'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
    setTimeout(done, 250)
  }, delay)
}
</script>
```

<PlaygroundLink code="<template>
<TransitionGroup
tag=&quot;ul&quot;
:css=&quot;false&quot;
@before-enter=&quot;onBeforeEnter&quot;
@enter=&quot;onEnter&quot;

>

    <li v-for=&quot;(item, index) in items&quot; :key=&quot;item.id&quot; :data-index=&quot;index&quot;>
      {{ item.name }}
    </li>

  </TransitionGroup>
</template>
&#10;<script setup>
function onBeforeEnter(el: HTMLElement) {
  el.style.opacity = '0'
  el.style.transform = 'translateY(12px)'
}
&#10;function onEnter(el: HTMLElement, done: () => void) {
  const delay = Number(el.dataset.index) * 80
  setTimeout(() => {
    el.style.transition = 'all 0.25s ease'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
    setTimeout(done, 250)
  }, delay)
}
</script>" />

## Transition vs TransitionGroup

|               | `<Transition>`                  | `<TransitionGroup>`                    |
| ------------- | ------------------------------- | -------------------------------------- |
| Hijos         | Un elemento o componente        | Múltiples (lista con v-for)            |
| Prop `mode`   | Compatible (`out-in`, `in-out`) | No compatible                          |
| Clase `.move` | No                              | Sí (anima reordenaciones)              |
| Prop `tag`    | No (no renderiza un wrapper)    | Sí (opcional, sin wrapper por defecto) |

Ver también: [¿Qué son los componentes dinámicos y KeepAlive?](/es/q/dynamic-components-keepalive) · [¿Cómo funcionan los estilos scoped?](/es/q/css-scoped-modules-dynamic)

## Referencias

- [Transition](https://vuejs.org/guide/built-ins/transition.html) - Vue.js docs
- [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html) - Vue.js docs
