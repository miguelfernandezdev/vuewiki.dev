---
order: 142
title: "¿Cuáles son las diferencias entre Nuxt 2 y Nuxt 3?"
difficulty: "intermediate"
tags: ["nuxt", "migration"]
---

Nuxt 3 es una reescritura completa sobre Vue 3, Vite y el motor de servidor Nitro. Los cambios van más allá del salto de Vue 2 a Vue 3: la herramienta de build, la capa de servidor, la obtención de datos, la gestión de estado, el sistema de módulos y la experiencia con TypeScript son todos distintos. La filosofía central es la misma (convención sobre configuración, enrutamiento basado en archivos, SSR por defecto), pero casi toda la superficie de API ha cambiado.

## Comparativa

| Aspecto | Nuxt 2 | Nuxt 3 |
|---|---|---|
| Versión de Vue | Vue 2 (Options API) | Vue 3 (Composition API) |
| Herramienta de build | Webpack | Vite (por defecto), Webpack opcional |
| Motor de servidor | Connect | Nitro (basado en h3) |
| Gestión de estado | Vuex | Pinia / `useState` |
| Archivo de configuración | `nuxt.config.js` | `nuxt.config.ts` |
| Auto-importaciones | Solo componentes (parcial) | Componentes, composables, utils, utils de servidor |
| TypeScript | Opcional, configuración compleja | Primera clase, sin configuración |
| Creación de módulos | Hooks de Nuxt 2 | API de `@nuxt/kit` |
| Obtención de datos | `asyncData` / `fetch` (Options API) | `useFetch` / `useAsyncData` (Composition API) |
| Middleware | Objeto `context` | Composables + `navigateTo` |
| Plugins | `inject` + `context` | `defineNuxtPlugin` + `nuxtApp` |
| Renderizado | SSR o estático | SSR, estático, híbrido (reglas por ruta) |
| Despliegue | Principalmente Node.js | Universal (Node, Vercel, Netlify, Cloudflare, Deno) |

## Obtención de datos

El cambio de API más importante. Nuxt 2 usaba opciones de componente (`asyncData`, `fetch`) que recibían un objeto `context`. Nuxt 3 usa composables en `<script setup>`:

```ts
// Nuxt 2: asyncData recibe context
export default {
  async asyncData({ $axios, params }) {
    const user = await $axios.$get(`/users/${params.id}`)
    return { user }
  }
}
```

```vue
<!-- Nuxt 3: composable en script setup -->
<script setup>
const route = useRoute()
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

`useFetch` gestiona el caché, la deduplicación, la transferencia del payload SSR y la cancelación de peticiones automáticamente. En Nuxt 2, todo eso había que gestionarlo manualmente.

## Motor de servidor: Nitro

Nuxt 2 usaba Connect (el mismo servidor que hay detrás de Express). Nuxt 3 usa Nitro, un motor de servidor independiente construido sobre h3:

```
server/
  api/          → endpoints /api/*
  routes/       → rutas de servidor personalizadas
  middleware/   → middleware de servidor (se ejecuta en cada petición)
  plugins/      → hooks del ciclo de vida de Nitro
  utils/        → utilidades de servidor con auto-importación
```

Nitro compila el servidor a una salida autocontenida que funciona en cualquier plataforma. La misma base de código se despliega en Node.js, serverless de Vercel, Cloudflare Workers o Netlify Edge sin cambiar el código.

## Middleware

```ts
// Nuxt 2: middleware basado en context
export default function ({ store, redirect }) {
  if (!store.state.auth.loggedIn) {
    redirect('/login')
  }
}
```

```ts
// Nuxt 3: middleware basado en composables
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

Nuxt 3 también distingue entre middleware de rutas (se ejecuta en la navegación, reside en `middleware/`) y middleware de servidor (se ejecuta en cada petición HTTP, reside en `server/middleware/`).

## Gestión de estado

```ts
// Nuxt 2: store Vuex con mutations
export const state = () => ({ count: 0 })
export const mutations = {
  INCREMENT(state) { state.count++ }
}
export const actions = {
  increment({ commit }) { commit('INCREMENT') }
}
```

```ts
// Nuxt 3: store de Pinia (o useState para casos simples)
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { count, increment }
})

// O para estado compartido simple sin Pinia:
const count = useState('count', () => 0)
```

Las mutations desaparecen. Las acciones modifican el estado directamente. `useState` es compatible con SSR (a diferencia de un `ref` simple en el ámbito de módulo, que se filtra entre peticiones).

## Auto-importaciones

Nuxt 2 solo auto-importaba componentes del directorio `components/`. Nuxt 3 auto-importa todo:

- APIs de Vue (`ref`, `computed`, `watch`, `onMounted`)
- Composables de Nuxt (`useFetch`, `useRoute`, `useState`, `navigateTo`)
- Tus composables de `composables/`
- Tus utils de `utils/`
- Utils de servidor de `server/utils/`
- Componentes de `components/`

No hacen falta imports manuales. TypeScript sigue proporcionando comprobación de tipos completa y autocompletado a través del archivo generado `.nuxt/imports.d.ts`.

## TypeScript

Nuxt 2 admitía TypeScript mediante `@nuxt/typescript-build`, que requería configuración extra y tenía cobertura de tipos incompleta. Nuxt 3 es TypeScript-first:

```ts
// nuxt.config.ts — TypeScript de serie
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    apiSecret: '',
    public: {
      apiBase: ''
    }
  }
})
```

Los tipos se generan automáticamente para rutas, middleware, plugins, componentes y composables. Sin configuración necesaria.

## Renderizado híbrido

Nuxt 2 era SSR completo o estático completo (`nuxt generate`). Nuxt 3 admite reglas de renderizado por ruta:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/blog/**': { isr: 3600 },
    '/api/**': { cors: true }
  }
})
```

Distintas páginas de la misma app pueden usar SSR, SSG, ISR o renderizado solo en el cliente. Nuxt 2 no podía hacer esto.

## Creación de módulos

```ts
// Nuxt 2: módulo con hooks
export default function MyModule() {
  this.nuxt.hook('build:before', () => { /* ... */ })
  this.addPlugin({ src: resolve(__dirname, 'plugin.js') })
}
```

```ts
// Nuxt 3: API de @nuxt/kit
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'my-module' },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    addPlugin(resolve('./runtime/plugin'))
  }
})
```

`@nuxt/kit` proporciona helpers tipados (`addPlugin`, `addComponent`, `addImports`, `addServerHandler`) que reemplazan los métodos `this.addX` ad-hoc de Nuxt 2.

Ver también: [¿Cuáles son los puntos de fricción al migrar de Nuxt 2 a Nuxt 3?](/es/q/nuxt2-to-nuxt3-friction) · [¿Cómo funcionan los auto-imports en Nuxt?](/es/q/nuxt-auto-imports) · [¿Cuáles son los modos de renderizado en Nuxt?](/es/q/nuxt-rendering-modes)

## Referencias

- [Nuxt 2 to Nuxt 3 Migration](https://nuxt.com/docs/migration/overview) - Nuxt docs
- [Introduction](https://nuxt.com/docs/getting-started/introduction) - Nuxt 3 docs
- [Module Author Guide](https://nuxt.com/docs/guide/going-further/modules) - Nuxt docs
