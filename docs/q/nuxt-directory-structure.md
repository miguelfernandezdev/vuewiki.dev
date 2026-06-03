---
order: 150
title: 'What is the Nuxt directory structure convention?'
difficulty: 'beginner'
tags: ['nuxt', 'architecture', 'vite']
summary: 'Convention-driven: pages/ for routes, server/api/ for endpoints, composables/ for auto-imports, components/ for auto-registered components.'
---

Nuxt is convention-driven. The directory structure IS the configuration. Where you place a file determines what it does: a `.vue` file in `pages/` becomes a route, a `.ts` file in `server/api/` becomes an API endpoint, a composable in `composables/` gets auto-imported. You don't wire things up manually.

## Full project structure

```
my-app/
├── app.vue                  ← root component
├── nuxt.config.ts           ← build-time configuration
├── app.config.ts            ← runtime app configuration
├── error.vue                ← custom error page
├── components/              ← auto-imported Vue components
├── composables/             ← auto-imported composables
├── utils/                   ← auto-imported utility functions
├── pages/                   ← file-based routing
├── layouts/                 ← layout wrappers for pages
├── middleware/              ← route middleware
├── plugins/                 ← Vue plugins (auto-registered)
├── assets/                  ← processed by the bundler (CSS, images, fonts)
├── public/                  ← served as-is (favicon, robots.txt)
├── server/                  ← Nitro server code
│   ├── api/                 ← API routes (/api/*)
│   ├── routes/              ← server routes (no /api prefix)
│   ├── middleware/          ← server middleware (every request)
│   ├── plugins/             ← server startup plugins
│   └── utils/               ← auto-imported server utilities
├── layers/                  ← local layers (auto-scanned)
└── modules/                 ← local Nuxt modules
```

## What each directory does

### components/

Auto-imported by filename. Folder names become prefixes:

```
components/
├── AppHeader.vue            → <AppHeader />
├── base/
│   └── Button.vue           → <BaseButton />
└── form/
    └── Input.vue            → <FormInput />
```

### composables/

Top-level files are auto-imported:

```
composables/
├── useAuth.ts               → useAuth() available everywhere
├── useCart.ts               → useCart() available everywhere
└── helpers/
    └── validate.ts          → NOT auto-imported (nested)
```

### pages/

Each file becomes a route:

```
pages/
├── index.vue                → /
├── about.vue                → /about
├── blog/
│   ├── index.vue            → /blog
│   └── [slug].vue           → /blog/:slug
└── [...slug].vue            → catch-all route
```

Without a `pages/` directory, vue-router is not included at all.

### layouts/

Wrappers that surround page content:

```
layouts/
├── default.vue              → used by all pages unless overridden
└── admin.vue                → pages opt in via definePageMeta
```

### middleware/

Route navigation guards:

```
middleware/
├── auth.ts                  → applied per-page via definePageMeta
└── analytics.global.ts      → runs on every route change
```

### plugins/

Run code at app startup. Auto-registered, ordered by filename:

```
plugins/
├── 01.auth.ts               → runs first
├── 02.analytics.client.ts   → client-only
└── 03.logger.server.ts      → server-only
```

### server/

Everything here runs in Nitro, not in Vue:

```
server/
├── api/users.get.ts         → GET /api/users
├── api/users.post.ts        → POST /api/users
├── api/users/[id].ts        → /api/users/:id
├── middleware/log.ts         → runs on every server request
├── plugins/db.ts            → runs once at server startup
└── utils/db.ts              → auto-imported in server code
```

### public/ vs assets/

`public/` files are served unchanged at the root URL:

```
public/favicon.ico           → /favicon.ico
public/robots.txt            → /robots.txt
```

`assets/` files are processed by the bundler (hashed, optimized):

```vue
<template>
  <img src="~/assets/images/hero.png" />
</template>

<style>
@import '~/assets/css/main.css';
</style>
```

## File naming conventions

| Pattern                      | Meaning                         |
| ---------------------------- | ------------------------------- |
| `[param].vue`                | Dynamic route parameter         |
| `[[param]].vue`              | Optional route parameter        |
| `[...slug].vue`              | Catch-all route                 |
| `(group)/`                   | Route group (folder not in URL) |
| `.client.vue` / `.client.ts` | Client-only                     |
| `.server.vue` / `.server.ts` | Server-only                     |
| `.global.ts`                 | Global middleware               |

## Special files

| File             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `app.vue`        | Root component (optional if `pages/` exists) |
| `nuxt.config.ts` | Build-time config (modules, Vite, Nitro)     |
| `app.config.ts`  | Runtime config (theme, feature flags)        |
| `error.vue`      | Custom error page                            |
| `.env`           | Environment variables                        |

## Everything is optional

You only create the directories you need. A minimal Nuxt app can be just `app.vue` and `nuxt.config.ts`. Add `pages/` when you need routing, `server/api/` when you need API endpoints, `components/` when you have shared components.

See also: [How does file-based routing work in Nuxt?](/q/nuxt-file-based-routing) · [How do auto-imports work in Nuxt?](/q/nuxt-auto-imports) · [What are Nuxt layers?](/q/nuxt-layers)

## References

- [Directory Structure](https://nuxt.com/docs/guide/directory-structure) - Nuxt docs
- [app.vue](https://nuxt.com/docs/guide/directory-structure/app) - Nuxt docs
- [nuxt.config.ts](https://nuxt.com/docs/guide/directory-structure/nuxt-config) - Nuxt docs
