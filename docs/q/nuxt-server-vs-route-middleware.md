---
order: 146
title: "What is the difference between server middleware and route middleware in Nuxt?"
difficulty: "intermediate"
tags: ["nuxt"]
---

They run at completely different layers. Server middleware runs on every HTTP request hitting the Nitro server (before API routes, before page rendering). Route middleware runs on page navigations (both server-side during SSR and client-side during SPA navigation). Server middleware handles HTTP-level concerns like CORS, logging, and auth headers. Route middleware handles page-level concerns like access control and redirects.

## Server middleware

Lives in `server/middleware/`. Runs on the Nitro server for every incoming request, including API routes, page requests, and static assets.

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

Server middleware does not return a response (unless it wants to block the request). It processes the request and passes it along to the next handler. The order follows alphabetical file naming.

### Typical use cases

- Request logging
- CORS headers
- Parsing auth tokens from cookies/headers and attaching to context
- Rate limiting
- Request ID generation

## Route middleware

Lives in `middleware/`. Runs during page navigation on both the server (SSR initial load) and the client (subsequent navigations). It has access to Vue composables and the Nuxt runtime.

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useAuth()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

### Three types of route middleware

**Named middleware**: defined in `middleware/`, applied to specific pages via `definePageMeta`:

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

**Inline middleware**: defined directly in the page, not reusable:

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

**Global middleware**: add a `.global` suffix to the filename. Runs on every page navigation without needing `definePageMeta`:

```ts
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to) => {
  trackPageView(to.fullPath)
})
```

## Side-by-side comparison

| | Server middleware | Route middleware |
|---|---|---|
| Location | `server/middleware/` | `middleware/` |
| Runs on | Every HTTP request | Page navigations |
| Environment | Server only (Nitro) | Server (SSR) + Client (SPA navigation) |
| Has access to | `event` (H3 event object) | `to`, `from` (Vue Router routes) |
| Can use Vue composables | No | Yes |
| Can use `navigateTo` | No (use `sendRedirect`) | Yes |
| Can read cookies | `getCookie(event, name)` | `useCookie(name)` |
| Blocks API routes | Yes | No (only affects pages) |
| Typical use | CORS, logging, token parsing | Auth guards, redirects, analytics |

## How they interact during SSR

On an initial SSR page load, both layers run in sequence:

```
Browser requests /dashboard
  → Server middleware runs (log, parse auth token)
    → Nitro routes the request to the page renderer
      → Route middleware runs (check auth, allow/redirect)
        → Page component renders
          → HTML sent to browser
```

On a client-side navigation (clicking a `<NuxtLink>`):

```
User clicks link to /dashboard
  → Route middleware runs in the browser (check auth, allow/redirect)
    → Page component renders on the client
    (server middleware is NOT involved — no HTTP request for the page)
```

## Common mistake: using route middleware for API protection

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) return navigateTo('/login')
})
```

This protects the `/dashboard` page from unauthenticated users. But it does NOT protect `/api/dashboard-data`. Anyone can call the API endpoint directly. Protect API routes with server middleware or server-side checks:

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

Always protect data at the API layer, not just at the page layer.

See also: [What is Nuxt middleware?](/q/nuxt-middleware) · [How do you implement authentication in Nuxt?](/q/nuxt-authentication) · [How do Nitro server routes work?](/q/nuxt-nitro-server-routes)

## References

- [middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/middleware) - Nuxt docs
- [server/middleware/ Directory](https://nuxt.com/docs/guide/directory-structure/server#server-middleware) - Nuxt docs
- [Route Middleware](https://nuxt.com/docs/getting-started/routing#route-middleware) - Nuxt docs
