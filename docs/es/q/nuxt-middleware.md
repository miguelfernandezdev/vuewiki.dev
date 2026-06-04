---
order: 152
title: '¿Qué son los middleware de Nuxt y cómo funcionan?'
difficulty: 'intermediate'
tags: ['nuxt', 'vue-router']
summary: 'El middleware de rutas protege navegaciones (auth, redirecciones). El de servidor gestiona HTTP (CORS, logging) antes de que Vue se ejecute.'
---

Nuxt tiene dos tipos de middleware que se ejecutan en capas distintas. El middleware de rutas se ejecuta en Vue antes de que se renderice una página (cliente y servidor). El middleware de servidor se ejecuta en Nitro antes de que la petición llegue a Vue.

## Middleware de rutas

El middleware de rutas intercepta la navegación. Úsalo para autenticación, redirecciones y guards a nivel de página.

### Middleware con nombre

Crea un archivo en `middleware/` y aplícalo a páginas específicas:

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

Aplica varios middleware en orden:

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'admin']
})
</script>
```

### Middleware global

Añade `.global` al nombre del archivo. Se ejecuta en cada cambio de ruta sin necesitar `definePageMeta`:

```ts
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) {
    trackPageView(to.fullPath)
  }
})
```

### Middleware inline

Define el middleware directamente en la página para lógica de un solo uso:

```vue
<script setup>
definePageMeta({
  middleware: [
    function (to, from) {
      if (to.query.legacy) {
        return navigateTo(to.path, { replace: true })
      }
    }
  ]
})
</script>
```

### Valores de retorno posibles

| Valor de retorno         | Efecto                                               |
| ------------------------ | ---------------------------------------------------- |
| Nada (`undefined`)       | Continúa la navegación                               |
| `navigateTo('/path')`    | Redirige a otra ruta                                 |
| `abortNavigation()`      | Cancela la navegación, permanece en la página actual |
| `abortNavigation(error)` | Cancela y muestra la página de error                 |

## Middleware de servidor

<img src="/diagrams/es/nuxt-middleware.svg" alt="Dos diagramas comparando los pipelines de middleware de servidor y de rutas en Nuxt" style="max-width: 100%;" />

El middleware de servidor se ejecuta en la capa de Nitro, antes de que Vue procese la petición. Gestiona peticiones HTTP en bruto, similar al middleware de Express.

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${event.method} ${getRequestURL(event)}`)
  // No devuelve nada, deja que la petición continúe
})
```

```ts
// server/middleware/cors.ts
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  })

  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
  }
})
```

Los archivos de middleware de servidor en `server/middleware/` se ejecutan automáticamente en cada petición al servidor. No hace falta registrarlos.

## Middleware de rutas vs middleware de servidor

|                             | Middleware de rutas                                | Middleware de servidor                  |
| --------------------------- | -------------------------------------------------- | --------------------------------------- |
| Ubicación                   | `middleware/`                                      | `server/middleware/`                    |
| Se ejecuta en               | Vue (cliente + servidor)                           | Nitro (solo servidor)                   |
| Tiene acceso a              | Composables de Vue, ruta, stores                   | Petición/respuesta HTTP en bruto        |
| Usar para                   | Guards de autenticación, redirecciones, analíticas | CORS, logging, cabeceras, rate limiting |
| Se aplica a                 | Páginas específicas o globalmente                  | Todas las peticiones al servidor        |
| Puede redirigir a rutas Vue | Sí (`navigateTo`)                                  | No (solo redirecciones HTTP)            |

Ver también: [¿Cuál es la diferencia entre server middleware y route middleware?](/es/q/nuxt-server-vs-route-middleware) · [¿Cómo implementar autenticación en Nuxt?](/es/q/nuxt-authentication) · [¿Cómo funciona Vue Router?](/es/q/vue-router-navigation-guards)

## Referencias

- [middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/middleware) - Nuxt docs
- [server/middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) - Nuxt docs
- [Route Middleware](https://nuxt.com/docs/getting-started/routing#route-middleware) - Nuxt docs
