---
order: 3
title: '¿Vue es una librería o un framework? ¿Por qué?'
difficulty: 'beginner'
tags: ['core', 'pinia', 'vite']
summary: 'Vue es un framework progresivo. El core es una librería de vistas, pero su ecosistema oficial (Router, Pinia, Vite) le da capacidades de framework completo.'
---

Vue se describe oficialmente como un "[framework progresivo](https://vuejs.org/guide/introduction.html)". El paquete principal (`vue`) es una librería de vistas centrada en renderizar la interfaz, comparable en alcance a React. Pero a diferencia de una librería pura, Vue incluye un ecosistema oficial ([Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/), scaffolding con [Vite](https://vite.dev/), [DevTools](https://devtools.vuejs.org/), SSR) que le da capacidades de framework completo. Empiezas solo con la capa de vista y adoptas más piezas a medida que tu proyecto las necesita.

## La distinción

Una **librería** proporciona herramientas que tú llamas cuando las necesitas. Tú controlas el flujo. jQuery y Lodash son librerías: tú llamas `$.ajax()` o `_.debounce()` dentro de tu propia estructura de código.

Un **framework** controla el flujo y llama a tu código. Tú rellenas los huecos. Angular y Nuxt son frameworks: dictan la estructura del proyecto, el pipeline de compilación y las convenciones de enrutamiento.

Vue se sitúa entre los dos dependiendo de cuánto de su ecosistema uses.

## Vue como librería

Si solo usas el paquete principal, Vue se comporta como una librería:

```html
<div id="app"></div>

<script type="module">
  import { createApp, ref } from 'vue'

  const App = {
    setup() {
      const count = ref(0)
      return { count }
    },
    template: `<button @click="count++">{{ count }}</button>`
  }

  createApp(App).mount('#app')
</script>
```

Tú decides la estructura del proyecto, la herramienta de compilación, la solución de enrutamiento y la gestión de estado. Vue gestiona el render y la reactividad. Nada más.

## Vue como framework

Cuando usas el ecosistema completo, Vue se convierte en un framework:

```
my-app/
├── src/
│   ├── router/          # Vue Router
│   ├── stores/          # Pinia
│   ├── views/           # Componentes de página
│   ├── components/      # Interfaz reutilizable
│   ├── composables/     # Lógica compartida
│   └── App.vue
├── vite.config.ts       # Vite (herramienta de compilación oficial)
└── package.json
```

[`create-vue`](https://github.com/vuejs/create-vue) genera esta estructura. Vue Router gestiona la navegación. Pinia gestiona el estado. Vite ejecuta el servidor de desarrollo y la compilación en producción. El ecosistema dicta las convenciones, lo que lo convierte en un framework en la práctica.

## Nuxt lo deja aún más claro

Nuxt es inequívocamente un framework construido sobre Vue. Controla el enrutamiento (basado en archivos), el render del servidor, la obtención de datos, el middleware y la estructura del proyecto. Tú escribes componentes y páginas; Nuxt decide cuándo y cómo se ejecutan.

```
my-nuxt-app/
├── pages/          # Enrutamiento basado en archivos (convención de Nuxt)
├── server/         # Rutas API (convención de Nuxt)
├── composables/    # Auto-importados (convención de Nuxt)
└── nuxt.config.ts  # Nuxt controla la compilación
```

## La parte "progresiva"

El lema oficial de Vue es "el framework progresivo" porque puedes escalar la adopción de forma incremental:

1. **Script incrustado**: añade Vue a una sola página para un widget interactivo
2. **SPA con Vite**: aplicación completa del lado del cliente con componentes y reactividad
3. **SPA con enrutamiento y estado**: añade Vue Router y Pinia
4. **SSR/SSG**: añade Nuxt para el render del servidor y el enrutamiento basado en archivos

En el paso 1, Vue es una librería. En el paso 4, es un framework completo. Avanzas por ese espectro según las necesidades del proyecto, sin cambiar de tecnología.

## Comparación con React y Angular

|                            | Vue                                  | React                        | Angular                     |
| -------------------------- | ------------------------------------ | ---------------------------- | --------------------------- |
| Núcleo                     | Capa de vista (reactividad + render) | Capa de vista (render)       | Framework completo          |
| Enrutamiento               | Oficial (Vue Router) pero opcional   | De terceros (React Router)   | Integrado (@angular/router) |
| Gestión de estado          | Oficial (Pinia) pero opcional        | De terceros (Redux, Zustand) | Integrado (Services + RxJS) |
| Herramienta de compilación | Oficial (Vite) pero opcional         | De terceros (Vite, Webpack)  | Integrado (Angular CLI)     |
| Estructura de proyecto     | Sugerida, no impuesta                | Sin convención               | Impuesta por el CLI         |
| Clasificación              | Framework progresivo                 | Librería                     | Framework                   |

React se llama a sí mismo una librería porque solo gestiona el render. Angular se llama a sí mismo un framework porque incluye todo. Vue empieza como librería y se convierte en framework al añadir su ecosistema oficial.

Ver también: [¿Qué es Vue y cuáles son sus características principales?](/es/q/what-is-vue)

## Referencias

- [Introduction](https://vuejs.org/guide/introduction.html) - Vue.js docs
- [Quick Start](https://vuejs.org/guide/quick-start.html) - Vue.js docs
- [Tooling](https://vuejs.org/guide/scaling-up/tooling.html) - Vue.js docs
