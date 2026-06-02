---
order: 30
title: "¿Cómo implementarías lazy loading y code splitting?"
difficulty: "advanced"
tags: ["performance", "vue-router"]
---

El code splitting divide tu app en archivos JavaScript más pequeños (chunks) que se cargan bajo demanda en lugar de todos a la vez. El lazy loading significa cargar un chunk solo cuando el usuario realmente lo necesita — al navegar a una ruta, abrir un modal o hacer scroll a una sección. Vite gestiona esto automáticamente cuando usas `import()` dinámico.

## Code splitting a nivel de ruta

La división más impactante. Cada ruta se convierte en su propio chunk, cargado solo cuando el usuario navega a ella:

```ts
const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
]
```

Cada `() => import(...)` le dice a Vite que cree un chunk separado. El navegador descarga el código de `/dashboard` solo cuando el usuario navega allí. Este es el patrón por defecto en Vue Router y no requiere configuración adicional.

## Code splitting a nivel de componente

Para componentes pesados dentro de una página que no siempre se necesitan:

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200,
  timeout: 10000
})
</script>

<template>
  <HeavyChart v-if="showChart" />
</template>
```

`delay` evita mostrar el componente de carga en cargas rápidas (evita un flash). `timeout` muestra el componente de error si la carga tarda demasiado.

Para casos simples sin estados de carga/error:

```ts
const HeavyChart = defineAsyncComponent(
  () => import('./components/HeavyChart.vue')
)
```

## Lazy loading condicional

Cargar componentes solo cuando se cumple una condición:

```vue
<script setup>
import { defineAsyncComponent, shallowRef } from 'vue'

const AdminPanel = shallowRef(null)

async function loadAdmin() {
  AdminPanel.value = defineAsyncComponent(
    () => import('./components/AdminPanel.vue')
  )
}
</script>

<template>
  <button @click="loadAdmin">Abrir Admin</button>
  <component :is="AdminPanel" v-if="AdminPanel" />
</template>
```

## Prefetching y preloading

Vite añade automáticamente `<link rel="modulepreload">` para los chunks enlazados desde el punto de entrada. Para rutas que el usuario probablemente visitará a continuación, el `<RouterLink>` de Vue Router no hace prefetch por defecto, pero puedes activarlo manualmente:

```ts
function prefetchRoute(path: string) {
  const route = router.resolve(path)
  const components = route.matched.flatMap(r =>
    Object.values(r.components ?? {})
  )
  components.forEach(c => {
    if (typeof c === 'function') (c as Function)()
  })
}
```

En Nuxt, `<NuxtLink>` hace prefetch de las rutas enlazadas automáticamente cuando entran en el viewport.

## Chunks con nombre

Agrupa rutas relacionadas en el mismo chunk con los comentarios mágicos de Vite:

```ts
const routes = [
  {
    path: '/settings/profile',
    component: () => import(/* webpackChunkName: "settings" */ './views/SettingsProfile.vue')
  },
  {
    path: '/settings/billing',
    component: () => import(/* webpackChunkName: "settings" */ './views/SettingsBilling.vue')
  }
]
```

Con Vite (Rollup), usa `manualChunks` en la configuración para más control sobre la agrupación de chunks.

## Qué hace Vite automáticamente

| Característica | ¿Automático? |
| --- | --- |
| Dividir en `import()` dinámicos | Sí |
| Tree-shake exports no usados | Sí |
| Code splitting CSS (por componente) | Sí |
| `modulepreload` para chunks de entrada | Sí |
| Separación de chunk de vendors | Sí (configurable) |

## Cuándo dividir

| Escenario | Enfoque |
| --- | --- |
| Diferentes páginas/rutas | División a nivel de ruta (hazlo siempre) |
| Componente pesado detrás de un toggle | `defineAsyncComponent` |
| Librería grande usada en una sola página | `import()` dinámico en el componente |
| Sección de admin que la mayoría nunca visita | Chunk de ruta separado |
| Componentes siempre visibles en la carga | No dividir (añade latencia) |

La mayor ganancia es la división a nivel de ruta — es el patrón por defecto en Vue Router y no cuesta nada implementarlo. La división a nivel de componente es para componentes pesados específicos donde la petición de red adicional compensa un bundle inicial más pequeño.

Ver también: [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Cómo funciona Vue Router?](/es/q/vue-router-navigation-guards) · [¿Qué es Vite?](/es/q/what-is-vite)

## Referencias

- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
- [Lazy Loading Routes](https://router.vuejs.org/guide/advanced/lazy-loading.html) - Vue Router docs
- [Code Splitting](https://vite.dev/guide/build.html) - Vite docs
