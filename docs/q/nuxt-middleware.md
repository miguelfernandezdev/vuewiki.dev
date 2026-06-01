---
order: 89
title: "What are Nuxt middleware and how do they work?"
difficulty: "intermediate"
tags: ["nuxt", "vue-router"]
---

Nuxt has two types of middleware that run at different layers. Route middleware runs in Vue before a page renders (client and server). Server middleware runs in Nitro before the request reaches Vue at all.

## Route middleware

Route middleware intercepts navigation. Use it for authentication, redirects, and page-level guards.

### Named middleware

Create a file in `middleware/` and apply it to specific pages:

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

Apply multiple middleware in order:

```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'admin']
})
</script>
```

### Global middleware

Add `.global` to the filename. It runs on every route change without needing `definePageMeta`:

```ts
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) {
    trackPageView(to.fullPath)
  }
})
```

### Inline middleware

Define middleware directly in the page for one-off logic:

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

### What you can return

| Return value | Effect |
|---|---|
| Nothing (`undefined`) | Continue navigation |
| `navigateTo('/path')` | Redirect to another route |
| `abortNavigation()` | Cancel navigation, stay on current page |
| `abortNavigation(error)` | Cancel and show error page |

## Server middleware

Server middleware runs in the Nitro layer, before Vue even processes the request. It handles raw HTTP requests, similar to Express middleware.

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`${event.method} ${getRequestURL(event)}`)
  // Don't return anything — lets the request continue
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

Server middleware files in `server/middleware/` run on every server request automatically. You don't need to register them.

## Route middleware vs server middleware

| | Route middleware | Server middleware |
|---|---|---|
| Location | `middleware/` | `server/middleware/` |
| Runs in | Vue (client + server) | Nitro (server only) |
| Has access to | Vue composables, route, stores | Raw HTTP request/response |
| Use for | Auth guards, redirects, analytics | CORS, logging, headers, rate limiting |
| Applied to | Specific pages or globally | All server requests |
| Can redirect to Vue routes | Yes (`navigateTo`) | No (HTTP redirects only) |
