---
order: 115
title: "¿Cómo se evitan los problemas con APIs específicas de plataforma en SSR?"
difficulty: "intermediate"
tags: ["ssr"]
---

En SSR, tu código Vue se ejecuta tanto en el servidor (Node.js) como en el navegador. APIs del navegador como `window`, `document` y `localStorage` no existen en el servidor y lanzarán un `ReferenceError`. Hay que proteger el código específico de cada plataforma para que solo se ejecute en el entorno correcto.

## APIs que fallan en el servidor

```ts
// TODAS estas rompen durante SSR
const width = ref(window.innerWidth)        // ReferenceError
const theme = localStorage.getItem('theme') // ReferenceError
const ua = navigator.userAgent              // ReferenceError
document.title = 'My Page'                  // ReferenceError
```

| API del navegador | Error en el servidor |
|---|---|
| `window` | ReferenceError |
| `document` | ReferenceError |
| `localStorage` / `sessionStorage` | ReferenceError |
| `navigator` | ReferenceError |
| `IntersectionObserver` | ReferenceError |
| `requestAnimationFrame` | ReferenceError |

## Solución 1: mover a onMounted

`onMounted` solo se ejecuta en el cliente. Es la solución más sencilla y habitual:

```vue
<script setup>
const width = ref(0)
const theme = ref('light')

onMounted(() => {
  width.value = window.innerWidth
  theme.value = localStorage.getItem('theme') || 'light'

  window.addEventListener('resize', () => {
    width.value = window.innerWidth
  })
})
</script>
```

Inicializa los refs con valores seguros que funcionen en el servidor y actualízalos tras el montaje.

## Solución 2: comprobación con typeof

Cuando necesitas comprobar fuera de los hooks del ciclo de vida (por ejemplo, en una función de utilidad):

```ts
function getStoredValue(key: string, fallback: string): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) ?? fallback
  }
  return fallback
}
```

## Solución 3: import.meta (Nuxt / Vite)

Nuxt y Vite ofrecen flags en tiempo de compilación que eliminan el código muerto mediante tree-shaking:

```vue
<script setup>
if (import.meta.client) {
  window.analytics.track('page_view')
}

if (import.meta.server) {
  console.log('Renderizando en el servidor')
}
</script>
```

El código dentro de `import.meta.server` se elimina del bundle del cliente, y viceversa. Es mejor que una comprobación en tiempo de ejecución porque reduce el tamaño del bundle.

## Solución 4: componente ClientOnly (Nuxt)

Envuelve los componentes exclusivos del navegador para que solo se rendericen en el cliente:

```vue
<template>
  <ClientOnly>
    <BrowserChart :data="chartData" />
    <template #fallback>
      <div class="skeleton" />
    </template>
  </ClientOnly>
</template>
```

El slot `#fallback` se renderiza durante el SSR para que el layout no salte cuando el componente carga.

## Solución 5: importación dinámica para librerías solo de navegador

Algunas librerías de terceros acceden a `window` al importarse. Usa `defineAsyncComponent` para aplazar la importación al cliente:

```vue
<script setup>
const MapView = defineAsyncComponent(() =>
  import('leaflet-vue').then(m => m.MapView)
)
</script>

<template>
  <ClientOnly>
    <MapView :center="[40, -3]" />
  </ClientOnly>
</template>
```

## Patrón de composable seguro para SSR

Cuando escribas composables que usen APIs del navegador, proporciona valores seguros por defecto para el servidor y aplaza el trabajo del navegador a `onMounted`:

```ts
export function useWindowSize() {
  const width = ref(0)
  const height = ref(0)

  if (typeof window !== 'undefined') {
    onMounted(() => {
      const update = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
      }
      update()
      window.addEventListener('resize', update)
      onUnmounted(() => window.removeEventListener('resize', update))
    })
  }

  return { width, height }
}
```

Este composable funciona en el servidor (devuelve ceros) y se actualiza correctamente en el cliente.

## La otra dirección: APIs de Node.js en el navegador

Las APIs exclusivas del servidor como `fs`, `path` y `process` no existen en el navegador. Mantenlas en directorios `server/` o detrás de guards `import.meta.server`:

```ts
// server/utils/config.ts — solo se ejecuta en el servidor
import { readFileSync } from 'fs'

export function loadConfig() {
  return JSON.parse(readFileSync('./config.json', 'utf-8'))
}
```

## Hooks del ciclo de vida y SSR

| Hook | ¿Se ejecuta en el servidor? | ¿Se ejecuta en el cliente? |
|---|---|---|
| `setup()` / `<script setup>` | Sí | Sí |
| `onServerPrefetch` | Sí | No |
| `onBeforeMount` | No | Sí |
| `onMounted` | No | Sí |
| `onBeforeUpdate` | No | Sí |
| `onUpdated` | No | Sí |
| `onUnmounted` | No | Sí |

`setup` se ejecuta en todos los entornos, por eso es donde el acceso a APIs del navegador es peligroso. Todo lo que viene desde `onBeforeMount` en adelante es exclusivo del cliente.

Ver también: [¿Qué es SSR?](/es/q/what-is-ssr) · [¿Qué causa los errores de hydration mismatch en SSR?](/es/q/ssr-hydration-mismatch) · [¿Qué es la hydration?](/es/q/what-is-hydration)

## Referencias

- [SSR](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html) - Vue.js docs
- [Client-Only Components](https://nuxt.com/docs/api/components/client-only) - Nuxt docs
