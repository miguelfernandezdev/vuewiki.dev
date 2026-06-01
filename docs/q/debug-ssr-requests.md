---
order: 148
title: "How do you debug SSR requests that don't go through the browser?"
difficulty: "advanced"
tags: ["nuxt", "ssr", "debugging"]
---

During SSR, HTTP requests go out from the Node.js server process, not from the browser. There is no Network tab. The server fetches data, renders HTML, and sends it to the client. If an API call fails or returns unexpected data during SSR, you won't see it in browser DevTools. You need server-side observability: interceptors that log to the terminal, proxy tools that capture outgoing traffic, and Nuxt DevTools' server request panel.

## The problem

```vue
<script setup>
// During SSR, this request happens on the server
// If it fails, the error appears in the terminal, not in the browser
const { data } = await useFetch('/api/users')
</script>
```

If `/api/users` returns a 500 during SSR, the page renders with empty data (or an error state). The browser Network tab only shows the final HTML response from the Nuxt server, not the upstream API calls the server made to build that HTML.

## Log with $fetch interceptors

Create a server-only plugin that wraps `$fetch` with logging:

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

The `.server.ts` suffix ensures this plugin only runs on the server. All `$fetch` and `useFetch` calls now log to your terminal:

```
[SSR Request] GET https://api.example.com/users
[SSR Response] 200 https://api.example.com/users
[SSR Request] GET https://api.example.com/posts
[SSR Response Error] 500 https://api.example.com/posts
```

## Verbose logging with DEBUG

ofetch (the HTTP client behind `$fetch`) and other libraries respect the `DEBUG` environment variable:

```bash
# See all HTTP activity
DEBUG=* nuxt dev

# Filter to specific libraries
DEBUG=ofetch nuxt dev
```

This is noisier but catches requests from any library, not just `$fetch`.

## Nuxt DevTools server tab

In development, Nuxt DevTools has a Server API panel that shows all server-side requests made during SSR. Open DevTools in the browser, navigate to the Server tab, and you can inspect:

- Which API calls the server made
- Request headers and body
- Response status, headers, and body
- Timing

This is the closest thing to a Network tab for SSR requests, but it only works in development mode.

## Proxy tools for deep inspection

For cases where you need to inspect the full request/response flow (headers, SSL certificates, redirects, timing), route the server's outgoing traffic through a proxy:

**Charles Proxy or mitmproxy**: intercept and inspect all HTTP/HTTPS traffic from the Node.js process.

```bash
# Route Node's traffic through a local proxy
HTTP_PROXY=http://localhost:8888 HTTPS_PROXY=http://localhost:8888 nuxt dev
```

This captures every outgoing request from the server, including third-party SDK calls, OAuth flows, and webhook callbacks. Useful for debugging auth token exchanges where you need to see the exact headers being sent.

## Server-side error handling

Wrap SSR data fetching with error context so you know what failed:

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

For Nitro server routes, use `createError` with descriptive messages:

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

The error and the log both appear in the terminal, giving you the full picture.

## Node.js inspector for breakpoints

For complex debugging, attach a Node.js debugger to the Nuxt server process:

```bash
node --inspect node_modules/.bin/nuxt dev
```

Then open `chrome://inspect` in Chrome and connect to the Node process. You can set breakpoints in server routes, middleware, and plugins, step through code, and inspect variables just like you would in client-side JavaScript.

## Debugging checklist

| Tool | What it shows | When to use |
|---|---|---|
| `$fetch` interceptor plugin | All SSR HTTP requests in terminal | First thing to add for SSR debugging |
| `console.log` on server | Quick checks | Simple issues |
| `DEBUG=*` env variable | Verbose library internals | Deep protocol-level issues |
| Nuxt DevTools server tab | Requests with full detail | Development, visual inspection |
| Charles Proxy / mitmproxy | Full HTTP traffic capture | Auth flows, SSL issues, redirects |
| Node.js inspector | Breakpoints, step-through | Complex logic bugs |
