---
order: 146
title: "¿Cuál es la diferencia entre el middleware de servidor y el middleware de rutas en Nuxt?"
difficulty: "intermediate"
tags: ["nuxt"]
---

Se ejecutan en capas completamente distintas. El middleware de servidor se ejecuta en cada petición HTTP que llega al servidor Nitro (antes de las rutas de API, antes del renderizado de páginas). El middleware de rutas se ejecuta en las navegaciones de página (tanto en el servidor durante SSR como en el cliente durante la navegación SPA). El middleware de servidor gestiona aspectos HTTP como CORS, logging y cabeceras de autenticación. El middleware de rutas gestiona aspectos de página como el control de acceso y las redirecciones.

## Middleware de servidor

Reside en `server/middleware/`. Se ejecuta en el servidor Nitro para cada petición entrante, incluidas las rutas de API, las peticiones de página y los assets estáticos.

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`[${event.method}] ${getRequestURL(event).pathname}`)
})
```

```ts
// server/middleware/auth-header.ts
export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')
  if (token) {
    event.context.user = verifyToken(token)
  }
})
```

El middleware de servidor no devuelve una respuesta (a menos que quiera bloquear la petición). Procesa la petición y la pasa al siguiente handler. El orden sigue el nombre alfabético de los archivos.

### Casos de uso habituales

- Logging de peticiones
- Cabeceras CORS
- Parseo de tokens de autenticación de cookies/cabeceras y adjuntarlos al contexto
- Rate limiting
- Generación de IDs de petición

## Middleware de rutas

Reside en `middleware/`. Se ejecuta durante la navegación de páginas tanto en el servidor (carga inicial SSR) como en el cliente (navegaciones posteriores). Tiene acceso a los composables de Vue y al runtime de Nuxt.

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useAuth()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

### Tres tipos de middleware de rutas

**Middleware con nombre**: definido en `middleware/`, aplicado a páginas específicas mediante `definePageMeta`:

```ts
// middleware/admin.ts
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth()
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
```

```vue
<!-- pages/admin.vue -->
<script setup>
definePageMeta({
  middleware: 'admin'
})
</script>
```

**Middleware inline**: definido directamente en la página, no es reutilizable:

```vue
<script setup>
definePageMeta({
  middleware: [
    function (to, from) {
      if (to.query.token !== 'valid') {
        return abortNavigation()
      }
    }
  ]
})
</script>
```

**Middleware global**: añade el sufijo `.global` al nombre del archivo. Se ejecuta en cada navegación de página sin necesitar `definePageMeta`:

```ts
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to) => {
  trackPageView(to.fullPath)
})
```

## Comparativa

| | Middleware de servidor | Middleware de rutas |
|---|---|---|
| Ubicación | `server/middleware/` | `middleware/` |
| Se ejecuta en | Cada petición HTTP | Navegaciones de página |
| Entorno | Solo servidor (Nitro) | Servidor (SSR) + Cliente (navegación SPA) |
| Tiene acceso a | `event` (objeto H3 event) | `to`, `from` (rutas de Vue Router) |
| Puede usar composables Vue | No | Sí |
| Puede usar `navigateTo` | No (usa `sendRedirect`) | Sí |
| Puede leer cookies | `getCookie(event, name)` | `useCookie(name)` |
| Bloquea rutas de API | Sí | No (solo afecta a páginas) |
| Uso habitual | CORS, logging, parseo de tokens | Guards de autenticación, redirecciones, analíticas |

## Cómo interactúan durante SSR

En una carga inicial de página SSR, ambas capas se ejecutan en secuencia:

```
El navegador solicita /dashboard
  → El middleware de servidor se ejecuta (log, parsea el token de autenticación)
    → Nitro enruta la petición al renderizador de página
      → El middleware de rutas se ejecuta (comprueba autenticación, permite/redirige)
        → El componente de página se renderiza
          → Se envía el HTML al navegador
```

En una navegación del lado del cliente (clic en un `<NuxtLink>`):

```
El usuario hace clic en el enlace a /dashboard
  → El middleware de rutas se ejecuta en el navegador (comprueba autenticación, permite/redirige)
    → El componente de página se renderiza en el cliente
    (el middleware de servidor NO interviene, no hay petición HTTP para la página)
```

## Error habitual: usar middleware de rutas para proteger la API

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) return navigateTo('/login')
})
```

Esto protege la página `/dashboard` de usuarios no autenticados. Pero NO protege `/api/dashboard-data`. Cualquiera puede llamar al endpoint de la API directamente. Protege las rutas de API con middleware de servidor o comprobaciones del lado del servidor:

```ts
// server/middleware/api-auth.ts
export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname.startsWith('/api/admin')) {
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }
})
```

Protege siempre los datos en la capa de API, no solo en la capa de página.

Ver también: [¿Qué es el middleware de Nuxt?](/es/q/nuxt-middleware) · [¿Cómo implementar autenticación en Nuxt?](/es/q/nuxt-authentication) · [¿Cómo funcionan las rutas de servidor de Nitro?](/es/q/nuxt-nitro-server-routes)

## Referencias

- [middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/middleware) - Nuxt docs
- [server/middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) - Nuxt docs
- [Route Middleware](https://nuxt.com/docs/getting-started/routing#route-middleware) - Nuxt docs
