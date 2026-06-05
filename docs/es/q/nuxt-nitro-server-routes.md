---
order: 154
title: '¿Qué es Nitro y cómo funcionan las rutas de servidor en Nuxt?'
difficulty: 'intermediate'
tags: ['nuxt', 'ssr', 'vueuse']
summary: 'Nitro es el motor de servidor de Nuxt. Los archivos en server/api/ se convierten en endpoints automáticamente con enrutamiento basado en archivos.'
---

Nitro es el motor de servidor de Nuxt. Gestiona las rutas de API, el middleware de servidor y el despliegue. Escribes el código del servidor en `server/`, y Nitro lo compila para cualquier plataforma de alojamiento (Node, Cloudflare Workers, Vercel, Deno, etc.) sin cambios de configuración.

<img src="/diagrams/es/nuxt-nitro-server-routes.svg" alt="Diagrama de enrutamiento mostrando petición HTTP al router Nitro hacia API, rutas y handler SSR" style="max-width: 100%;" />

## Rutas de API

Crea archivos en `server/api/` y se convierten en endpoints automáticamente:

```ts
// server/api/hello.ts
export default defineEventHandler(() => {
  return { message: 'Hola desde el servidor' }
})
```

Esto responde a todos los métodos HTTP en `/api/hello`. Para restringirlo a un método específico, añádelo al nombre del archivo:

```ts
// server/api/users.get.ts → GET /api/users
export default defineEventHandler(async () => {
  const users = await db.query('SELECT * FROM users')
  return users
})

// server/api/users.post.ts → POST /api/users
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user = await db.insert('users', body)
  return user
})
```

## Rutas de servidor (no API)

Los archivos en `server/routes/` funcionan igual pero sin el prefijo `/api`:

```ts
// server/routes/health.get.ts → GET /health
export default defineEventHandler(() => ({ status: 'ok' }))
```

## Parámetros de ruta y query

```ts
// server/api/users/[id].ts → /api/users/42
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await db.findUser(id)
})

// server/api/search.get.ts → /api/search?q=vue&page=1
export default defineEventHandler((event) => {
  const { q, page } = getQuery(event)
  return searchArticles(q, Number(page) || 1)
})
```

## Cuerpo de la petición, cabeceras y cookies

```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const token = getHeader(event, 'authorization')

  const sessionId = getCookie(event, 'session')
  setCookie(event, 'visited', 'true', { httpOnly: true })

  return { received: body }
})
```

## Manejo de errores

Usa `createError` para devolver errores HTTP correctos:

```ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = await db.findUser(id)

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuario no encontrado'
    })
  }

  return user
})
```

## Utilidades de servidor

Crea lógica reutilizable del lado del servidor en `server/utils/`. Los archivos allí se auto-importan en todas las rutas de servidor:

```ts
// server/utils/db.ts
export function getDb() {
  return useStorage('db')
}

// server/api/items.get.ts — sin necesidad de importar
export default defineEventHandler(async () => {
  const db = getDb()
  return await db.getKeys()
})
```

## Plugins de servidor

Ejecuta código una vez cuando arranca Nitro. Útil para conexiones a base de datos o tareas programadas:

```ts
// server/plugins/db.ts
export default defineNitroPlugin((nitro) => {
  const pool = createPool(process.env.DATABASE_URL)

  nitro.hooks.hook('close', () => pool.end())
})
```

> **Nota Nuxt 4:** `defineNitroPlugin` es la API de Nuxt 3. En Nuxt 4, los plugins de servidor usan `definePlugin` importado desde `'nitro'`. Si estás migrando a Nuxt 4, reemplaza `defineNitroPlugin` con `import { definePlugin } from 'nitro'`. Ambas APIs funcionan de la misma manera; solo cambian el import y el nombre de la función.

## Llamar a rutas de servidor desde el cliente

Usa `useFetch` o `$fetch`. Ambos tienen tipado cuando la ruta de servidor está en tu proyecto:

```vue
<script setup>
// useFetch — compatible con SSR, cacheado, reactivo
const { data: users } = await useFetch('/api/users')

// $fetch — petición simple, adecuado para mutaciones
async function createUser(name: string) {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: { name }
  })
}
</script>
```

## Estructura de directorios

```
server/
├── api/              ← rutas /api/*
│   ├── users.get.ts
│   ├── users.post.ts
│   └── users/
│       └── [id].ts
├── routes/           ← rutas no API (sin prefijo /api)
│   └── health.get.ts
├── middleware/        ← se ejecuta en cada petición
│   └── log.ts
├── plugins/          ← se ejecuta una vez al arrancar
│   └── db.ts
└── utils/            ← utilidades de servidor con auto-importación
    └── db.ts
```

Ver también: [¿Cuál es la diferencia entre server middleware y route middleware?](/es/q/nuxt-server-vs-route-middleware) · [¿Cómo desplegar una app Nuxt?](/es/q/nuxt-deployment) · [¿Cuál es la convención de estructura de directorios de Nuxt?](/es/q/nuxt-directory-structure)

## Referencias

- [Server Routes](https://nuxt.com/docs/guide/directory-structure/server) - Nuxt docs
- [Nitro](https://nitro.build/) - Nitro docs
- [Server API and Routes](https://nuxt.com/docs/getting-started/server) - Nuxt docs
