---
order: 27
title: '¿Qué son Teleport, Fragments y Suspense?'
difficulty: 'intermediate'
tags: ['components', 'suspense', 'teleport']
summary: 'Teleport renderiza contenido fuera del árbol del componente. Fragments permiten múltiples elementos raíz. Suspense maneja estados de carga async.'
---

Estas son tres funcionalidades integradas introducidas en Vue 3. Cada una resuelve un problema diferente: renderizar contenido fuera del árbol de componentes, permitir múltiples elementos raíz, y manejar dependencias asíncronas con estados de carga.

## Teleport

[`<Teleport>`](https://vuejs.org/guide/built-ins/teleport.html) renderiza sus hijos en una parte diferente del DOM, fuera del elemento del componente padre. La lógica del componente (props, eventos, reactividad) permanece en su lugar; solo la salida DOM se mueve.

```vue
<script setup>
import { ref } from 'vue'
const showModal = ref(false)
</script>

<template>
  <button @click="showModal = true">Abrir</button>

  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <p>Esto se renderiza como hijo directo de body</p>
        <button @click="showModal = false">Cerrar</button>
      </div>
    </div>
  </Teleport>
</template>
```

<PlaygroundLink code="<script setup>
import { ref } from 'vue'
const showModal = ref(false)
</script>
&#10;<template>
  <button @click=&quot;showModal = true&quot;>Abrir</button>
&#10;  <Teleport to=&quot;body&quot;>
    <div v-if=&quot;showModal&quot; class=&quot;modal-overlay&quot;>
      <div class=&quot;modal&quot;>
        <p>Esto se renderiza como hijo directo de body</p>
        <button @click=&quot;showModal = false&quot;>Cerrar</button>
      </div>
    </div>
  </Teleport>
</template>" />

Sin Teleport, un modal dentro de un componente profundamente anidado hereda todo el CSS del padre (`overflow: hidden`, `z-index`, `transform`), lo cual puede recortar o posicionar mal el modal. Teleportar a `<body>` evita esos problemas. La prop `to` acepta cualquier selector CSS o elemento DOM.

Usos comunes: modales, tooltips, menús dropdown, notificaciones. Cualquier cosa que necesite escapar visualmente del layout de su padre.

## Fragments

En Vue 2, cada componente necesitaba un único elemento raíz. Esto forzaba `<div>` wrapper innecesarios:

```vue
<!-- Vue 2: requería un único raíz -->
<template>
  <div>
    <header>Header</header>
    <main>Content</main>
  </div>
</template>
```

<PlaygroundLink code="<template>
  <div>
    <header>Header</header>
    <main>Content</main>
  </div>
</template>" />

Vue 3 soporta **fragments**, es decir, múltiples elementos raíz sin wrapper:

```vue
<!-- Vue 3: múltiples raíces, sin wrapper necesario -->
<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>
```

<PlaygroundLink code="<template>
  <header>Header</header>
  <main>Content</main>
  <footer>Footer</footer>
</template>" />

Un detalle: los [atributos fallthrough](/es/q/fallthrough-attrs) no funcionan automáticamente con componentes multi-raíz porque Vue no sabe a qué raíz aplicarlos. Necesitas vincular `$attrs` explícitamente.

## Suspense

[`<Suspense>`](https://vuejs.org/guide/built-ins/suspense.html) muestra contenido fallback mientras espera a que los componentes hijos asíncronos se resuelvan. Funciona con componentes que tienen un `async setup()` o que se cargan con [`defineAsyncComponent`](/es/q/async-components).

```vue
<template>
  <Suspense>
    <template #default>
      <UserDashboard />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

<PlaygroundLink code="<template>
  <Suspense>
    <template #default>
      <UserDashboard />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>" />

Si `UserDashboard` tiene un `setup` asíncrono (devuelve una promise), Suspense muestra `LoadingSpinner` hasta que la promise se resuelve. También puedes manejar errores con [`onErrorCaptured`](/es/q/error-handling) en el padre.

> **Nota:** Suspense sigue siendo una API experimental. El comportamiento base es estable, pero la API puede tener cambios menores.

Ver también: [¿Cómo funciona Suspense para componentes asíncronos?](/es/q/suspense) · [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Qué son los atributos fallthrough?](/es/q/fallthrough-attrs)

## Referencias

- [Teleport](https://vuejs.org/guide/built-ins/teleport.html) - Vue.js docs
- [Fragments](https://v3-migration.vuejs.org/new/fragments.html) - Vue 3 Migration Guide
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
