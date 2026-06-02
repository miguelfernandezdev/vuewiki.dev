---
order: 154
title: "What is Nitro and how do server routes work in Nuxt?"
difficulty: "intermediate"
tags: ["nuxt", "ssr", "vueuse"]
summary: "Nitro is Nuxt's server engine. Files in server/api/ become API endpoints automatically with file-based routing."
---

Nitro is Nuxt's server engine. It handles API routes, server middleware, and deployment. You write your server code in `server/`, and Nitro compiles it for any hosting platform (Node, Cloudflare Workers, Vercel, Deno, etc.) with zero config changes.

## API routes

Create files in `server/api/` and they become endpoints automatically:

```ts
// server/api/hello.ts
export default defineEventHandler(() => {
  return { message: 'Hello from the server' }
})
```

This responds to all HTTP methods at `/api/hello`. To restrict to a specific method, add it to the filename:

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

## Server routes (non-API)

Files in `server/routes/` work the same but without the `/api` prefix:

```ts
// server/routes/health.get.ts → GET /health
export default defineEventHandler(() => ({ status: 'ok' }))
```

## Route and query parameters

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

## Request body, headers, and cookies

```ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const token = getHeader(event, 'authorization')

  const sessionId = getCookie(event, 'session')
  setCookie(event, 'visited', 'true', { httpOnly: true })

  return { received: body }
})
```

## Error handling

Use `createError` to return proper HTTP errors:

```ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = await db.findUser(id)

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  return user
})
```

## Server utilities

Create reusable server-side logic in `server/utils/`. Files there are auto-imported across all server routes:

```ts
// server/utils/db.ts
export function getDb() {
  return useStorage('db')
}

// server/api/items.get.ts — no import needed
export default defineEventHandler(async () => {
  const db = getDb()
  return await db.getKeys()
})
```

## Server plugins

Run code once when Nitro starts. Useful for database connections or scheduled jobs:

```ts
// server/plugins/db.ts
export default defineNitroPlugin((nitro) => {
  const pool = createPool(process.env.DATABASE_URL)

  nitro.hooks.hook('close', () => pool.end())
})
```

## Calling server routes from the client

Use `useFetch` or `$fetch`. Both are type-safe when the server route is in your project:

```vue
<script setup>
// useFetch — SSR-aware, cached, reactive
const { data: users } = await useFetch('/api/users')

// $fetch — plain request, good for mutations
async function createUser(name: string) {
  const user = await $fetch('/api/users', {
    method: 'POST',
    body: { name }
  })
}
</script>
```

## Directory structure

```
server/
├── api/              ← /api/* routes
│   ├── users.get.ts
│   ├── users.post.ts
│   └── users/
│       └── [id].ts
├── routes/           ← non-API routes (no /api prefix)
│   └── health.get.ts
├── middleware/        ← runs on every request
│   └── log.ts
├── plugins/          ← runs once at startup
│   └── db.ts
└── utils/            ← auto-imported server utilities
    └── db.ts
```

See also: [What is the difference between server and route middleware?](/q/nuxt-server-vs-route-middleware) · [How do you deploy a Nuxt app?](/q/nuxt-deployment) · [What is the Nuxt directory structure?](/q/nuxt-directory-structure)

## References

- [Server Routes](https://nuxt.com/docs/guide/directory-structure/server) - Nuxt docs
- [Nitro](https://nitro.build/) - Nitro docs
- [Server API and Routes](https://nuxt.com/docs/getting-started/server) - Nuxt docs
