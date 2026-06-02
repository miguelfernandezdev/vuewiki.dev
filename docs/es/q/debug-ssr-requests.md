---
order: 148
title: "¿Cómo depuras peticiones SSR que no pasan por el navegador?"
difficulty: "advanced"
tags: ["nuxt", "ssr", "debugging"]
---

Durante el SSR, las peticiones HTTP salen desde el proceso Node.js del servidor, no desde el navegador. No hay pestaña de Red. El servidor obtiene los datos, renderiza el HTML y lo envía al cliente. Si una llamada a la API falla o devuelve datos inesperados durante el SSR, no lo verás en las DevTools del navegador. Necesitas observabilidad del lado del servidor: interceptores que registren en el terminal, herramientas proxy que capturen el tráfico saliente y el panel de peticiones del servidor de Nuxt DevTools.

## El problema

```vue
<script setup>
// Durante el SSR, esta petición ocurre en el servidor
// Si falla, el error aparece en el terminal, no en el navegador
const { data } = await useFetch('/api/users')
</script>
```

Si `/api/users` devuelve un 500 durante el SSR, la página se renderiza con datos vacíos (o un estado de error). La pestaña de Red del navegador solo muestra la respuesta HTML final del servidor Nuxt, no las llamadas a la API upstream que el servidor realizó para construir ese HTML.

## Registrar con interceptores de $fetch

Crea un plugin exclusivo del servidor que envuelva `$fetch` con logging:

```ts
// plugins/debug-ssr.server.ts
export default defineNuxtPlugin(() => {
  globalThis.$fetch = globalThis.$fetch.create({
    onRequest({ request, options }) {
      console.log('[SSR Request]', options.method || 'GET', request)
    },
    onRequestError({ request, error }) {
      console.error('[SSR Request Error]', request, error.message)
    },
    onResponse({ request, response }) {
      console.log('[SSR Response]', response.status, request)
    },
    onResponseError({ request, response }) {
      console.error('[SSR Response Error]', response.status, request)
    }
  })
})
```

El sufijo `.server.ts` garantiza que este plugin solo se ejecute en el servidor. Todas las llamadas a `$fetch` y `useFetch` ahora se registran en tu terminal:

```
[SSR Request] GET https://api.example.com/users
[SSR Response] 200 https://api.example.com/users
[SSR Request] GET https://api.example.com/posts
[SSR Response Error] 500 https://api.example.com/posts
```

## Logging detallado con DEBUG

ofetch (el cliente HTTP detrás de `$fetch`) y otras librerías respetan la variable de entorno `DEBUG`:

```bash
# Ver toda la actividad HTTP
DEBUG=* nuxt dev

# Filtrar a librerías específicas
DEBUG=ofetch nuxt dev
```

Produce más ruido, pero captura peticiones de cualquier librería, no solo de `$fetch`.

## Pestaña de servidor en Nuxt DevTools

En desarrollo, Nuxt DevTools tiene un panel de API del servidor que muestra todas las peticiones del lado del servidor realizadas durante el SSR. Abre DevTools en el navegador, navega a la pestaña Server y podrás inspeccionar:

- Qué llamadas a la API realizó el servidor
- Cabeceras y cuerpo de la petición
- Estado, cabeceras y cuerpo de la respuesta
- Tiempos

Es lo más parecido a una pestaña de Red para peticiones SSR, pero solo funciona en modo desarrollo.

## Herramientas proxy para inspección profunda

Para casos en los que necesitas inspeccionar el flujo completo de petición/respuesta (cabeceras, certificados SSL, redirecciones, tiempos), enruta el tráfico saliente del servidor a través de un proxy:

**Charles Proxy o mitmproxy**: interceptan e inspeccionan todo el tráfico HTTP/HTTPS del proceso Node.js.

```bash
# Enrutar el tráfico de Node a través de un proxy local
HTTP_PROXY=http://localhost:8888 HTTPS_PROXY=http://localhost:8888 nuxt dev
```

Esto captura cada petición saliente del servidor, incluyendo llamadas a SDKs de terceros, flujos OAuth y callbacks de webhooks. Útil para depurar intercambios de tokens de autenticación donde necesitas ver las cabeceras exactas que se envían.

## Manejo de errores del lado del servidor

Envuelve la obtención de datos SSR con contexto de error para saber qué falló:

```vue
<script setup>
const { data, error } = await useFetch('/api/users')

if (error.value) {
  console.error('[SSR] Failed to load users:', {
    status: error.value.statusCode,
    message: error.value.statusMessage,
    url: '/api/users'
  })
}
</script>
```

Para rutas del servidor Nitro, usa `createError` con mensajes descriptivos:

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const response = await $fetch('https://api.example.com/users').catch((err) => {
    console.error('[Server] Upstream API failed:', err.status, err.message)
    throw createError({
      statusCode: 502,
      statusMessage: 'Upstream API unavailable'
    })
  })
  return response
})
```

El error y el log aparecen ambos en el terminal, dándote el panorama completo.

## Inspector de Node.js para puntos de interrupción

Para depuración compleja, adjunta un depurador de Node.js al proceso del servidor Nuxt:

```bash
node --inspect node_modules/.bin/nuxt dev
```

Luego abre `chrome://inspect` en Chrome y conéctate al proceso Node. Puedes establecer puntos de interrupción en rutas del servidor, middleware y plugins, avanzar por el código e inspeccionar variables igual que harías en JavaScript del lado del cliente.

## Lista de verificación para depuración

| Herramienta | Qué muestra | Cuándo usarla |
|---|---|---|
| Plugin interceptor de `$fetch` | Todas las peticiones HTTP SSR en el terminal | Lo primero que añadir para depurar SSR |
| `console.log` en el servidor | Comprobaciones rápidas | Problemas sencillos |
| Variable de entorno `DEBUG=*` | Internos detallados de la librería | Problemas profundos a nivel de protocolo |
| Pestaña de servidor de Nuxt DevTools | Peticiones con detalle completo | Desarrollo, inspección visual |
| Charles Proxy / mitmproxy | Captura completa del tráfico HTTP | Flujos de autenticación, problemas SSL, redirecciones |
| Inspector de Node.js | Puntos de interrupción, ejecución paso a paso | Errores en lógica compleja |

Ver también: [¿Cómo funciona el data fetching en Nuxt?](/es/q/nuxt-data-fetching) · [¿Cómo funciona el payload de SSR en Nuxt?](/es/q/nuxt-payload) · [¿Cómo funcionan las rutas de servidor de Nitro?](/es/q/nuxt-nitro-server-routes)

## Referencias

- [Data Fetching](https://nuxt.com/docs/getting-started/data-fetching) - Nuxt docs
- [Debugging](https://nodejs.org/en/learn/getting-started/debugging) - Node.js docs
- [Nuxt DevTools](https://devtools.nuxt.com/) - Nuxt DevTools docs
