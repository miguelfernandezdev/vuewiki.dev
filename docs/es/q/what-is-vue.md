---
order: 1
title: '¿Qué es Vue y cuáles son sus características principales?'
difficulty: 'beginner'
tags: ['core', 'pinia']
summary: 'Un framework JavaScript para construir UIs con templates declarativos, un modelo basado en componentes y un sistema de reactividad que actualiza el DOM automáticamente.'
---

Vue es un framework JavaScript para construir interfaces de usuario. Extiende HTML, CSS y JavaScript estándar con un modelo declarativo y basado en componentes, y un [sistema de reactividad](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) que actualiza el DOM automáticamente cuando cambian tus datos.

## Características principales

**Render declarativo.** Escribes templates que describen cómo debe verse la interfaz para un estado dado. Vue mantiene el DOM sincronizado.

```vue
<template>
  <p>Hello, {{ name }}</p>
</template>

<script setup>
import { ref } from 'vue'
const name = ref('World')
</script>
```

**Reactividad.** Vue rastrea las dependencias en tiempo de ejecución. Cuando un valor reactivo cambia, solo las partes del DOM que dependen de él se vuelven a renderizar.

```ts
const count = ref(0)
const doubled = computed(() => count.value * 2)

count.value++ // doubled se convierte automáticamente en 2
```

**Arquitectura basada en componentes.** Construyes interfaces componiendo componentes pequeños y reutilizables, cada uno con su propio template, lógica y estilos.

```
App
├── Header
├── Sidebar
│   └── NavItem (x5)
└── MainContent
    ├── ArticleCard (x10)
    └── Pagination
```

**[Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html).** Cada archivo `.vue` agrupa template, script y estilos en un solo lugar, con CSS con ámbito opcional.

```vue
<script setup>
// lógica
</script>

<template>
  <!-- marcado -->
</template>

<style scoped>
/* estilos aislados a este componente */
</style>
```

## Cómo se compara Vue con otros frameworks

| Característica             | Vue                                    | React                                                | Angular                               |
| -------------------------- | -------------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Render                     | Basado en template (con JSX opcional)  | JSX                                                  | Basado en template                    |
| Reactividad                | Integrada y granular (Proxy)           | Manual (useState + re-render)                        | Zone.js / Signals                     |
| Estilos                    | CSS con ámbito, CSS Modules integrados | Soluciones externas (CSS Modules, styled-components) | Con ámbito por componente por defecto |
| Tamaño del bundle (aprox.) | ~33 KB                                 | ~42 KB                                               | ~50+ KB                               |
| Curva de aprendizaje       | Suave                                  | Moderada                                             | Pronunciada                           |

La filosofía de diseño de Vue es la adopción progresiva: empieza solo con la librería principal para el render de vistas, luego añade paquetes oficiales ([Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/), [Nuxt](https://nuxt.com/)) a medida que tu proyecto crece. No tienes que comprometerte con el stack completo desde el principio.

Ver también: [¿Qué es el Virtual DOM y cómo lo usa Vue?](/es/q/virtual-dom), [¿Vue es una librería o un framework?](/es/q/vue-library-or-framework)

## Referencias

- [Introduction](https://vuejs.org/guide/introduction.html) - Vue.js docs
- [Quick Start](https://vuejs.org/guide/quick-start.html) - Vue.js docs
- [Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html) - Vue.js docs
