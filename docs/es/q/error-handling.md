---
order: 52
title: '¿Cómo funciona el manejo de errores en Vue?'
difficulty: 'advanced'
tags: ['components', 'error-handling', 'suspense']
summary: 'onErrorCaptured captura errores de componentes descendientes (error boundaries). app.config.errorHandler captura errores globales no manejados.'
---

Vue proporciona `onErrorCaptured` para capturar errores de componentes descendientes, lo que permite construir límites de error similares al `componentDidCatch` de React. Combinado con `app.config.errorHandler` para errores globales y las opciones de error de `defineAsyncComponent`, puedes gestionar fallos a todos los niveles.

## onErrorCaptured (límite de error)

Un componente padre puede capturar errores lanzados por cualquier descendiente (incluyendo errores asíncronos de lifecycle hooks y watchers):

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = (ref < Error) | (null > null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error(`Error in ${info}:`, err)
  return false // detiene la propagación a los manejadores de errores padre
})
</script>

<template>
  <div v-if="error" class="error-state">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="error = null">Try again</button>
  </div>
  <slot v-else />
</template>
```

```vue
<!-- Uso -->
<template>
  <ErrorBoundary>
    <DashboardWidget />
  </ErrorBoundary>
</template>
```

El callback recibe tres argumentos:

| Argumento  | Descripción                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `err`      | El objeto de error                                                                             |
| `instance` | La instancia del componente que lanzó el error                                                 |
| `info`     | Una cadena que describe dónde se capturó el error (p. ej., `"render"`, `"setup"`, `"watcher"`) |

Devolver `false` impide que el error se propague. Devolver `true` (o nada) lo deja subir hasta los manejadores de errores padre y `app.config.errorHandler`.

## Manejador global de errores

Captura cualquier error que no fue detenido por `onErrorCaptured`:

```ts
// main.ts
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  // Enviar al servicio de seguimiento de errores
  errorTracker.captureException(err, { info })
}
```

## Flujo de errores

```
Componente lanza → onErrorCaptured más cercano (puede detenerse aquí)
                 → onErrorCaptured padre (puede detenerse aquí)
                 → ... subiendo por el árbol ...
                 → app.config.errorHandler
                 → console.error (si nada lo captura)
```

## Errores de componentes asíncronos

`defineAsyncComponent` tiene su propio manejo de errores con lógica de reintento:

```ts
const AsyncWidget = defineAsyncComponent({
  loader: () => import('./Widget.vue'),
  errorComponent: ErrorDisplay,
  timeout: 10000,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry()
    } else {
      fail() // muestra errorComponent
    }
  }
})
```

## Qué captura el manejo de errores de Vue

| Origen                                            | ¿Capturado?                                          |
| ------------------------------------------------- | ---------------------------------------------------- |
| Errores de render/template                        | Sí                                                   |
| Errores en lifecycle hooks                        | Sí                                                   |
| Errores en callbacks de watchers                  | Sí                                                   |
| Errores en manejadores de eventos del componente  | Sí                                                   |
| Errores en hooks de directivas personalizadas     | Sí                                                   |
| Callbacks de `setTimeout`/`setInterval`           | No (Vue no los rastrea)                              |
| Listeners de eventos nativos añadidos manualmente | No                                                   |
| Errores en librerías de terceros                  | No (a menos que se llamen desde el lifecycle de Vue) |

Para errores fuera del rastreo de Vue (temporizadores, listeners manuales), usa `window.addEventListener('error', handler)` o `window.addEventListener('unhandledrejection', handler)`.

## Patrón práctico: múltiples límites de error

Envuelve secciones independientes para que un fallo no derrumbe toda la página:

```vue
<template>
  <header>
    <ErrorBoundary>
      <Navigation />
    </ErrorBoundary>
  </header>

  <main>
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </main>

  <aside>
    <ErrorBoundary>
      <Sidebar />
    </ErrorBoundary>
  </aside>
</template>
```

Ver también: [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Cómo funciona Suspense?](/es/q/suspense)

## Referencias

- [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) - Vue.js docs
- [app.config.errorHandler](https://vuejs.org/api/application.html#app-config-errorhandler) - Vue.js docs
