---
order: 60
title: "¿Qué son los componentes asíncronos y defineAsyncComponent?"
difficulty: "intermediate"
tags: ["components", "performance"]
---

Los componentes asíncronos permiten dividir el bundle cargando el código de un componente solo cuando se necesita. En lugar de importar el componente al inicio del archivo (lo que lo incluye en el bundle del componente padre), envuelves la importación en `defineAsyncComponent` y Vite crea un chunk separado para él.

## Uso básico

```ts
import { defineAsyncComponent } from 'vue'

const AdminPanel = defineAsyncComponent(() => import('./AdminPanel.vue'))
```

`AdminPanel` se comporta como un componente normal en los templates, pero su código solo se descarga del servidor cuando el componente se renderiza por primera vez.

## Estados de carga y error

El objeto de opciones completo permite controlar lo que el usuario ve mientras el componente carga o si falla.

```ts
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 30000
})
```

| Opción | Propósito |
|---|---|
| `loader` | La función de importación dinámica |
| `loadingComponent` | Se muestra mientras carga |
| `delay` | Milisegundos antes de mostrar el componente de carga (por defecto: 200) |
| `errorComponent` | Se muestra si la importación falla o supera el timeout |
| `timeout` | Milisegundos antes de considerarlo un fallo |

El `delay` evita que el spinner aparezca en un destello en componentes que cargan rápido. Mantén el valor en torno a 200ms salvo que tengas un motivo para cambiarlo.

## Cuándo usar componentes asíncronos

Marcan la diferencia cuando el componente es grande y no siempre se necesita:

```ts
// Componente pesado detrás de una condición
const ChartEditor = defineAsyncComponent(() => import('./ChartEditor.vue'))

// División a nivel de ruta (Vue Router lo hace automáticamente)
const routes = [
  { path: '/admin', component: () => import('./views/Admin.vue') }
]
```

No envuelvas componentes pequeños y siempre visibles. El coste de una petición de red adicional supera el ahorro en el bundle.

## Lazy hydration (Vue 3.5+, SSR)

En aplicaciones SSR, los componentes asíncronos se renderizan en el servidor pero pueden retrasar la hydration en el cliente hasta que realmente se necesiten.

```ts
import {
  defineAsyncComponent,
  hydrateOnVisible,
  hydrateOnIdle,
  hydrateOnInteraction
} from 'vue'

// Hidrata cuando el usuario hace scroll hasta el componente
const Comments = defineAsyncComponent({
  loader: () => import('./Comments.vue'),
  hydrate: hydrateOnVisible({ rootMargin: '100px' })
})

// Hidrata durante tiempo inactivo
const Footer = defineAsyncComponent({
  loader: () => import('./Footer.vue'),
  hydrate: hydrateOnIdle(5000)
})

// Hidrata con la primera interacción
const SearchPanel = defineAsyncComponent({
  loader: () => import('./SearchPanel.vue'),
  hydrate: hydrateOnInteraction(['focus', 'click'])
})
```

Esto reduce el JavaScript que el navegador tiene que procesar antes de que la página sea interactiva.

## Componentes asíncronos frente a división a nivel de ruta

| | `defineAsyncComponent` | Lazy loading de rutas |
|---|---|---|
| Alcance | Cualquier componente | Vistas a nivel de ruta |
| Configuración | Manual | Integrado en Vue Router |
| UI de carga | Opción `loadingComponent` | Navigation guards del router |
| Caso de uso | UI condicional, widgets pesados | División de código a nivel de página |

La división a nivel de ruta (`() => import('./views/Page.vue')`) es la forma más común de dividir el código. `defineAsyncComponent` es para dividir dentro de una página.

Ver también: [¿Cómo funciona Suspense con componentes asíncronos?](/es/q/suspense) · [¿Qué son los componentes dinámicos y KeepAlive?](/es/q/dynamic-components-keepalive) · [¿Qué son Teleport, Fragments y Suspense?](/es/q/teleport-fragments-suspense)

## Referencias

- [defineAsyncComponent()](https://vuejs.org/api/general.html#defineasynccomponent) - Vue.js docs
- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
