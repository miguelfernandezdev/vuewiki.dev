---
order: 164
title: "¿Qué es el tree-shaking y cómo lo soporta Vue 3?"
difficulty: "intermediate"
tags: ["performance", "tooling"]
---

El tree-shaking es una optimización en tiempo de compilación donde el bundler (Vite/Rollup, webpack) elimina el código no utilizado del resultado final. Si importas `ref` y `computed` pero nunca usas `watch`, el bundler elimina `watch` del build de producción. Vue 3 fue reescrito específicamente para soportar esto. La API global de Vue 2 (`Vue.component`, `Vue.use`, `Vue.mixin`) hacía que todo fuera una sola importación, así que el bundler no podía eliminar nada.

## Cómo funciona

Los bundlers analizan estáticamente las sentencias `import`/`export` de los módulos ES. Si una función exportada no se importa en ningún punto del grafo de dependencias, es "código muerto" y se elimina:

```ts
// Vue exporta todo como named exports
import { ref, computed } from 'vue'

// El bundler ve que ref y computed se usan
// watch, watchEffect, provide, inject, etc. NO se importan
// → se eliminan del bundle final
```

Esto solo funciona con módulos ES (`import`/`export`). CommonJS (`require()`) es dinámico y no puede analizarse estáticamente, por lo que el tree-shaking no se aplica.

## Vue 2 vs Vue 3

Vue 2 usaba un singleton global:

```ts
// Vue 2: todo cuelga del constructor Vue
import Vue from 'vue'

Vue.component('MyComponent', { ... })
Vue.use(VueRouter)
Vue.mixin({ ... })
Vue.directive('focus', { ... })
```

Importar `Vue` incluye todo el runtime, incluyendo funcionalidades que nunca usas (transition, keep-alive, v-model en componentes, Suspense). El bundler no puede saber qué podría acceder `Vue.use(SomePlugin)` internamente, así que lo mantiene todo.

Vue 3 usa named exports:

```ts
// Vue 3: importa solo lo que usas
import { createApp, ref, computed, watch } from 'vue'
import { createRouter } from 'vue-router'
```

Cada API es un export separado que el bundler puede rastrear. Si tu aplicación nunca usa `<Transition>`, el código del runtime de transición se elimina del build.

## Impacto en el tamaño del bundle

El runtime core de Vue 3 ocupa aproximadamente 10 KB comprimido con gzip tras el tree-shaking (una aplicación mínima que usa `ref`, `computed` y el compilador de templates). El runtime de Vue 2 ocupaba aproximadamente 23 KB comprimido independientemente de las funcionalidades que usaras.

Las funcionalidades que el tree-shaking elimina con mayor frecuencia:

| Funcionalidad | Se elimina si no se usa |
|---|---|
| `<Transition>` / `<TransitionGroup>` | Sí |
| `<KeepAlive>` | Sí |
| `<Suspense>` | Sí |
| `<Teleport>` | Sí |
| `v-model` en componentes | Sí |
| Directiva `v-show` | Sí |
| APIs de reactividad (`watch`, `watchEffect`, etc.) | Sí, por función |
| Hooks del ciclo de vida (`onMounted`, etc.) | Sí, por hook |

## Qué rompe el tree-shaking

1. **Efectos secundarios en el ámbito del módulo**: código que se ejecuta al importar, aunque no se use ningún export:

```ts
// Esto se ejecuta cuando se importa el módulo, aunque nada se use
console.log('módulo cargado')
window.__INIT__ = true

export function unused() { ... }
```

El bundler no puede eliminar este módulo porque tiene efectos secundarios. Las librerías se marcan a sí mismas como libres de efectos secundarios en `package.json`:

```json
{
  "sideEffects": false
}
```

2. **Importaciones dinámicas con variables**: el bundler no puede resolver cadenas dinámicas:

```ts
// MAL: el bundler no puede analizar esto
const module = await import(`./modules/${name}.ts`)

// BIEN: los paths explícitos permiten al bundler crear chunks
const module = await import('./modules/auth.ts')
```

3. **Re-exportar todo**: los archivos barrel que exportan todo impiden la eliminación selectiva:

```ts
// Si index.ts re-exporta 50 componentes e importas 1,
// algunos bundlers mantienen los 50 a menos que cada uno esté correctamente aislado
export * from './ComponentA.vue'
export * from './ComponentB.vue'
// ... 48 más
```

## Analizar tu bundle

Usa `rollup-plugin-visualizer` (Vite) o `webpack-bundle-analyzer` para ver qué se incluye:

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true })
  ]
})
```

Genera un mapa de árbol interactivo que muestra el tamaño de cada módulo en el bundle final, facilitando la detección de código no utilizado que no fue eliminado por el tree-shaking.

Ver también: [¿Qué es Vite?](/es/q/what-is-vite) · [¿Cómo implementar lazy loading y code splitting?](/es/q/lazy-loading-code-splitting) · [¿Cómo optimizar el rendimiento en una app Vue?](/es/q/performance-optimization)

## Referencias

- [Tree-shaking](https://vuejs.org/guide/best-practices/performance.html#reduce-bundle-size) - Vue.js docs
- [Build Optimizations](https://vite.dev/guide/build.html) - Vite docs
- [Tooling](https://vuejs.org/guide/scaling-up/tooling.html) - Vue.js docs
